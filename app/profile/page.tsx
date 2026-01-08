'use client';

import { User, MapPin, LogOut, Camera, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useAvalancheForecasts, getUniqueCenters } from '@/hooks/useAvalancheForecasts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile editing state
  const [profile, setProfile] = useState<UserProfile>({ display_name: null, avatar_url: null });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Location state
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'center' | 'zone'>('center');
  const [tempCenter, setTempCenter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useAvalancheForecasts();

  const centers = useMemo(() => {
    if (!data?.forecasts) return [];
    const unique = getUniqueCenters(data.forecasts);
    return unique.map(c => ({
      id: c.name,
      name: c.name,
      state: c.state,
      zoneCount: c.zones.length,
      zones: c.zones
    }));
  }, [data]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load user preferences and profile
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        // Load preferences
        const prefResponse = await fetch(`/api/preferences?userId=${user.id}`);
        const prefData = await prefResponse.json();

        if (prefData.success && prefData.preferences) {
          setSelectedCenter(prefData.preferences.selected_center);
          setSelectedZone(prefData.preferences.selected_zone);
        }

        // Load profile
        const profileResponse = await fetch(`/api/profile?userId=${user.id}`);
        const profileData = await profileResponse.json();

        if (profileData.success && profileData.profile) {
          setProfile({
            display_name: profileData.profile.display_name,
            avatar_url: profileData.profile.avatar_url
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    return profile.display_name || user?.email?.split('@')[0] || 'User';
  };

  const handleStartEditName = () => {
    setEditedName(profile.display_name || user?.email?.split('@')[0] || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          displayName: editedName.trim(),
          avatarUrl: profile.avatar_url
        })
      });

      const data = await response.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, display_name: editedName.trim() }));
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // For now, create a local URL preview
    // In production, you'd upload to Supabase Storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;

      setIsSavingProfile(true);
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            displayName: profile.display_name,
            avatarUrl: dataUrl
          })
        });

        const data = await response.json();
        if (data.success) {
          setProfile(prev => ({ ...prev, avatar_url: dataUrl }));
        }
      } catch (error) {
        console.error('Error saving avatar:', error);
      } finally {
        setIsSavingProfile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenLocationSheet = () => {
    setTempCenter(selectedCenter);
    setLocationStep('center');
    setSearchQuery('');
    setLocationSheetOpen(true);
  };

  const handleSelectCenter = (centerId: string) => {
    setTempCenter(centerId);
    setLocationStep('zone');
    setSearchQuery('');
  };

  const handleSelectZone = async (zone: string) => {
    if (!user || !tempCenter) return;

    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          selectedCenter: tempCenter,
          selectedZone: zone
        })
      });

      setSelectedCenter(tempCenter);
      setSelectedZone(zone);
      setLocationSheetOpen(false);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleBackToCenter = () => {
    setLocationStep('center');
    setSearchQuery('');
  };

  const selectedCenterData = centers.find(c => c.id === tempCenter);

  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredZones = selectedCenterData?.zones?.filter(z =>
    z.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar with edit button */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.display_name, user.email || 'SC')}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isSavingProfile}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name with edit */}
              <div className="w-full max-w-xs">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-center"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={isSavingProfile || !editedName.trim()}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEditName}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartEditName}
                    className="group flex items-center justify-center gap-2 w-full"
                  >
                    <span className="text-xl font-semibold">{getDisplayName()}</span>
                    <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <Separator />

            <button
              onClick={handleOpenLocationSheet}
              className="w-full flex items-center justify-between py-3 hover:bg-muted/50 -mx-3 px-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Default Location</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedZone || selectedCenter || 'Not set'}
                  </p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <Separator />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between py-3 hover:bg-muted/50 -mx-3 px-3 rounded-lg transition-colors text-destructive"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                <p className="font-medium">Sign Out</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Location Selection Sheet */}
        <Sheet open={locationSheetOpen} onOpenChange={setLocationSheetOpen}>
          <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col rounded-t-2xl">
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center gap-2">
                {locationStep === 'zone' && (
                  <Button variant="ghost" size="icon" onClick={handleBackToCenter}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                )}
                <div>
                  <SheetTitle>
                    {locationStep === 'center' ? 'Select Avalanche Center' : 'Select Zone'}
                  </SheetTitle>
                  {locationStep === 'zone' && selectedCenterData && (
                    <p className="text-sm text-muted-foreground">{selectedCenterData.name}</p>
                  )}
                </div>
              </div>
              <Input
                placeholder={locationStep === 'center' ? 'Search centers...' : 'Search zones...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-3"
              />
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {locationStep === 'center' ? (
                  filteredCenters.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No centers found</p>
                  ) : (
                    filteredCenters.map((center) => (
                      <button
                        key={center.id}
                        onClick={() => handleSelectCenter(center.id)}
                        className={`w-full p-4 rounded-lg text-left transition-colors flex items-center justify-between ${
                          selectedCenter === center.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{center.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {center.state} • {center.zoneCount} {center.zoneCount === 1 ? 'zone' : 'zones'}
                          </p>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))
                  )
                ) : (
                  filteredZones.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No zones found</p>
                  ) : (
                    filteredZones.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => handleSelectZone(zone)}
                        className={`w-full p-4 rounded-lg text-left transition-colors ${
                          selectedZone === zone && selectedCenter === tempCenter
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                        }`}
                      >
                        <p className="font-medium">{zone}</p>
                      </button>
                    ))
                  )
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
