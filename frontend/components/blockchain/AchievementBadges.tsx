'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Star, Users, Eye, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface AchievementNFT {
  tokenId: number;
  achievementType: number;
  name: string;
  description: string;
  imageURI: string;
  mintedAt: number;
  recipient: string;
}

const AchievementBadges: React.FC = () => {
  const [nfts, setNfts] = useState<AchievementNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserNFTs();
  }, []);

  const fetchUserNFTs = async () => {
    try {
      const response = await fetch('/api/blockchain/nft/user-nfts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNfts(data.nfts || []);
      } else {
        toast.error('Failed to fetch achievement badges');
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Error fetching achievement badges');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: number) => {
    switch (type) {
      case 0: // First Eye Test
        return <Eye className="w-6 h-6" />;
      case 1: // Vision Improved
        return <TrendingUp className="w-6 h-6" />;
      case 2: // Family Complete
        return <Users className="w-6 h-6" />;
      case 3: // Health Champion
        return <Trophy className="w-6 h-6" />;
      case 4: // Early Detector
        return <Award className="w-6 h-6" />;
      case 5: // Wellness Warrior
        return <Star className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  const getAchievementColor = (type: number): string => {
    switch (type) {
      case 0: return 'bg-blue-100 text-blue-600';
      case 1: return 'bg-green-100 text-green-600';
      case 2: return 'bg-purple-100 text-purple-600';
      case 3: return 'bg-yellow-100 text-yellow-600';
      case 4: return 'bg-red-100 text-red-600';
      case 5: return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const openOnOpenSea = (tokenId: number) => {
    // This would open the NFT on OpenSea or similar marketplace
    const contractAddress = '0x...'; // Replace with actual contract address
    const url = `https://testnets.opensea.io/assets/goerli/${contractAddress}/${tokenId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Badges
          </CardTitle>
          <CardDescription>
            Your unique NFT badges for health achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nfts.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No achievement badges yet</p>
              <p className="text-sm text-gray-400">
                Complete health activities to earn unique NFT badges
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nfts.map((nft) => (
                <Card key={nft.tokenId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center space-y-3">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getAchievementColor(nft.achievementType)}`}>
                        {getAchievementIcon(nft.achievementType)}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{nft.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {nft.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          Token #{nft.tokenId}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Earned on {formatDate(nft.mintedAt)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openOnOpenSea(nft.tokenId)}
                      >
                        View on OpenSea
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Available Achievements</CardTitle>
          <CardDescription>
            Complete these activities to earn NFT badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">First Eye Test</p>
                <p className="text-sm text-muted-foreground">
                  Complete your first eye health analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Vision Improved</p>
                <p className="text-sm text-muted-foreground">
                  Show improvement in your eye health
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Family Complete</p>
                <p className="text-sm text-muted-foreground">
                  Add all family members to your account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Health Champion</p>
                <p className="text-sm text-muted-foreground">
                  Complete 10 health activities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Early Detector</p>
                <p className="text-sm text-muted-foreground">
                  Detect health issues early through regular testing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Wellness Warrior</p>
                <p className="text-sm text-muted-foreground">
                  Maintain consistent health monitoring
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Achievement NFTs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Unique Digital Collectibles</p>
              <p className="text-sm text-muted-foreground">
                Each achievement badge is a unique NFT that proves your health accomplishments
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Tradeable Assets</p>
              <p className="text-sm text-muted-foreground">
                Your NFT badges can be traded on OpenSea and other NFT marketplaces
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Charity Support</p>
              <p className="text-sm text-muted-foreground">
                20% of NFT sale proceeds automatically go to eye health charities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementBadges;
