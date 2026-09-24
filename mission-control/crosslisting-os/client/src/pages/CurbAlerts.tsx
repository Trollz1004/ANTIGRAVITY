import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, DollarSign, Image as ImageIcon, ExternalLink, ArrowRight, Check, Tag } from "lucide-react";
import { toast } from "sonner";

export default function CurbAlerts() {
  const [keywords, setKeywords] = useState("curb alert, free");
  const [maxPrice, setMaxPrice] = useState<number>(10);
  const [source, setSource] = useState<"all" | "craigslist" | "facebook_marketplace" | "freebie_apps">("all");
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = trpc.curbAlerts.search.useQuery({
    keywords,
    maxPrice,
    hasPhotoOnly: true,
    source,
  });

  const importMutation = trpc.curbAlerts.importToCatalog.useMutation({
    onSuccess: (res, variables) => {
      toast.success(res.message);
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
    },
  });

  const handleImport = async (item: any) => {
    try {
      await importMutation.mutateAsync({
        title: item.title,
        description: item.description,
        sourcePrice: item.price,
        targetResalePrice: item.aiFlipAnalysis.estimatedResalePrice,
        imageUrl: item.imageUrl,
        sourceUrl: item.itemUrl,
      });
      setImportedIds((prev) => new Set(prev).add(item.id));
    } catch (e) {
      // Handled by onError
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h1 className="text-2xl font-bold tracking-tight">AI Curb Scout & Free Finder</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Scouting Craigslist, FB Marketplace, and Freebie apps for local items under $10 with photos for instant crosslisting flips.
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300">
            Rule Enforced: Price ≤ $10 • Photo Required
          </Badge>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 bg-card/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Keywords</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="curb alert, free, moving sale"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Max Price Cap</Label>
              <Select value={maxPrice.toString()} onValueChange={(val) => setMaxPrice(Number(val))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Max Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">FREE Only ($0)</SelectItem>
                  <SelectItem value="5">Under $5</SelectItem>
                  <SelectItem value="10">Under $10 (Max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Source Feed</Label>
              <Select value={source} onValueChange={(val: any) => setSource(val)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Feeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feeds (Craigslist / FB / Apps)</SelectItem>
                  <SelectItem value="craigslist">Craigslist</SelectItem>
                  <SelectItem value="facebook_marketplace">FB Marketplace</SelectItem>
                  <SelectItem value="freebie_apps">Freebie Apps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => refetch()} className="h-9 w-full md:w-auto">
              <Sparkles className="w-4 h-4 mr-2" />
              Scout Local Items
            </Button>
          </div>
        </Card>

        {/* Results Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Scouting local feeds for curb alerts and free items...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No curb alerts or items under ${maxPrice} with photos found matching criteria. Try adjusting keywords.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((item) => {
              const isImported = importedIds.has(item.id);
              return (
                <Card key={item.id} className="flex flex-col overflow-hidden border hover:border-amber-400/50 transition-all">
                  {/* Image with overlay badges */}
                  <div className="relative h-48 w-full bg-muted overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge className={item.price === 0 ? "bg-emerald-600 text-white font-bold" : "bg-blue-600 text-white font-bold"}>
                        {item.price === 0 ? "FREE $0" : `$${item.price.toFixed(2)}`}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
                        {item.source}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-black font-semibold text-xs">
                        {item.aiFlipAnalysis.recommendation}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold line-clamp-1">{item.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground flex justify-between">
                      <span>📍 {item.location}</span>
                      <span>🕒 {item.postedTime}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 flex-1 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                    {/* AI Resale Box */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Est. Resale Price:</span>
                        <span className="text-emerald-600 font-bold">${item.aiFlipAnalysis.estimatedResalePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Est. Net Profit:</span>
                        <span className="font-semibold text-foreground">+${item.aiFlipAnalysis.estimatedProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
                        <Tag className="w-3 h-3 text-amber-500" />
                        Target: {item.aiFlipAnalysis.suggestedPlatforms.join(", ")}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      variant={isImported ? "outline" : "default"}
                      disabled={isImported || importMutation.isPending}
                      onClick={() => handleImport(item)}
                      className="w-full"
                    >
                      {isImported ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-emerald-500" />
                          Imported to Catalog
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1 text-amber-400" />
                          Import & Crosslist
                        </>
                      )}
                    </Button>

                    <a href={item.itemUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="px-2">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
