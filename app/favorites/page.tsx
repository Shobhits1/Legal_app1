"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  BookOpen,
  Scale,
  FileText,
  Clock,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FavoriteItem {
  id: string;
  type: string;
  itemId: string;
  createdAt: string;
  item: any; // Will contain the detailed item information
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (type: string, itemId: string, favoriteId: string) => {
    try {
      setRemoving(favoriteId);
      const response = await fetch(`/api/favorites?type=${type}&itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));

      toast({
        title: "Removed from favorites",
        description: "Item removed successfully.",
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemoving(null);
    }
  };

  const getFilteredFavorites = (type?: string) => {
    if (!type) return favorites;
    return favorites.filter(fav => fav.type === type);
  };

  const renderFavoriteItem = (favorite: FavoriteItem) => {
    const { item, type } = favorite;

    if (!item) return null;

    return (
      <Card key={favorite.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {type === 'LEGAL_SECTION' && <BookOpen className="h-4 w-4 text-blue-600" />}
              {type === 'CASE_LAW' && <Scale className="h-4 w-4 text-green-600" />}
              {type === 'FIR_TEMPLATE' && <FileText className="h-4 w-4 text-orange-600" />}

              <div>
                <CardTitle className="text-lg">
                  {type === 'LEGAL_SECTION' && `${item.act} Section ${item.section} - ${item.title}`}
                  {type === 'CASE_LAW' && item.title}
                  {type === 'FIR_TEMPLATE' && `${item.firNumber} - ${item.title}`}
                </CardTitle>
                <CardDescription className="mt-1">
                  {type === 'LEGAL_SECTION' && `${item.category} • ${item.frequency} frequency`}
                  {type === 'CASE_LAW' && `${item.citation} • ${item.court}`}
                  {type === 'FIR_TEMPLATE' && `${item.status} • ${item.priority} priority`}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(favorite.createdAt).toLocaleDateString()}
              </Badge>

              <Button
                size="sm"
                variant="outline"
                onClick={() => removeFavorite(favorite.type, favorite.itemId, favorite.id)}
                disabled={removing === favorite.id}
              >
                {removing === favorite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {type === 'LEGAL_SECTION' && item.description}
            {type === 'CASE_LAW' && item.summary}
            {type === 'FIR_TEMPLATE' && item.description}
          </p>

          {type === 'LEGAL_SECTION' && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.frequency}</Badge>
            </div>
          )}

          {type === 'CASE_LAW' && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.relevance}</Badge>
              <Badge variant="outline">⭐ {item.rating}/5</Badge>
            </div>
          )}

          {type === 'FIR_TEMPLATE' && (
            <div className="flex flex-wrap gap-2">
              <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
              <Badge variant="outline">{item.priority}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            My Favorites
          </h1>
          <p className="text-sm text-muted-foreground">
            Your saved legal sections, case laws, and FIR templates
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading favorites...</span>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({favorites.length})
                </TabsTrigger>
                <TabsTrigger value="LEGAL_SECTION">
                  Legal Sections ({getFilteredFavorites('LEGAL_SECTION').length})
                </TabsTrigger>
                <TabsTrigger value="CASE_LAW">
                  Case Laws ({getFilteredFavorites('CASE_LAW').length})
                </TabsTrigger>
                <TabsTrigger value="FIR_TEMPLATE">
                  FIR Templates ({getFilteredFavorites('FIR_TEMPLATE').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {favorites.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                      <p className="text-muted-foreground text-center">
                        Start exploring legal sections, case laws, and FIR templates.<br />
                        Click the heart icon to add items to your favorites.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {favorites.map(renderFavoriteItem)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="LEGAL_SECTION" className="space-y-4">
                {getFilteredFavorites('LEGAL_SECTION').length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No saved legal sections</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getFilteredFavorites('LEGAL_SECTION').map(renderFavoriteItem)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="CASE_LAW" className="space-y-4">
                {getFilteredFavorites('CASE_LAW').length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Scale className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No saved case laws</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getFilteredFavorites('CASE_LAW').map(renderFavoriteItem)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="FIR_TEMPLATE" className="space-y-4">
                {getFilteredFavorites('FIR_TEMPLATE').length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No saved FIR templates</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getFilteredFavorites('FIR_TEMPLATE').map(renderFavoriteItem)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
