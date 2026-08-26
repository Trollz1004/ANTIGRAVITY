import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Sparkles, 
  Hash, 
  Copy, 
  Check, 
  RefreshCw,
  TrendingUp,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TONES = ["inspiring", "informative", "urgent", "casual", "professional"];
const CONTENT_TYPES = ["post", "article", "event_description", "call_to_action"];

export default function ContentGenerator() {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingHashtags, setGeneratingHashtags] = useState(false);
  
  // Content form
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [tone, setTone] = useState("inspiring");
  const [contentType, setContentType] = useState("post");
  const [generatedContent, setGeneratedContent] = useState(null);
  
  // Hashtag form
  const [hashtagCategory, setHashtagCategory] = useState("");
  const [hashtagCity, setHashtagCity] = useState("");
  const [hashtagCount, setHashtagCount] = useState(10);
  const [recommendedHashtags, setRecommendedHashtags] = useState(null);
  
  // History
  const [contentHistory, setContentHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, cityRes, historyRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/cities`, { params: { limit: 20 } }),
        axios.get(`${API}/content/history`),
      ]);
      setCategories(catRes.data.categories);
      setCities(cityRes.data);
      setContentHistory(historyRes.data);
      
      // Set defaults
      if (catRes.data.categories.length > 0) {
        setCategory(catRes.data.categories[0]);
        setHashtagCategory(catRes.data.categories[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const generateContent = async () => {
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/content/generate`, {
        category,
        city: city === "all" ? null : city,
        tone,
        content_type: contentType,
      });
      setGeneratedContent(res.data);
      setContentHistory((prev) => [res.data, ...prev.slice(0, 19)]);
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(error.response?.data?.detail || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const generateHashtags = async () => {
    if (!hashtagCategory) {
      toast.error("Please select a category");
      return;
    }
    
    setGeneratingHashtags(true);
    try {
      const res = await axios.post(`${API}/hashtags/recommend`, {
        category: hashtagCategory,
        city: hashtagCity === "all" ? null : hashtagCity,
        count: hashtagCount,
      });
      setRecommendedHashtags(res.data);
      toast.success("Hashtags generated successfully!");
    } catch (error) {
      console.error("Error generating hashtags:", error);
      toast.error(error.response?.data?.detail || "Failed to generate hashtags");
    } finally {
      setGeneratingHashtags(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const copyAllHashtags = () => {
    if (recommendedHashtags?.hashtags) {
      const text = recommendedHashtags.hashtags.map((h) => `#${h.tag}`).join(" ");
      copyToClipboard(text, "all-hashtags");
    }
  };

  return (
    <div className="space-y-8" data-testid="content-generator-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
          AI Content Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate engaging posts, hashtags, and content suggestions
        </p>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md" data-testid="content-tabs">
          <TabsTrigger value="content" data-testid="tab-content">
            <Sparkles className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="hashtags" data-testid="tab-hashtags">
            <Hash className="w-4 h-4 mr-2" />
            Hashtags
          </TabsTrigger>
        </TabsList>

        {/* Content Generator Tab */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card className="content-card" data-testid="content-form-card">
              <CardHeader className="content-card-header">
                <CardTitle className="font-heading text-lg">Generate Content</CardTitle>
                <CardDescription>AI-powered post suggestions for your platform</CardDescription>
              </CardHeader>
              <CardContent className="content-card-body space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-10" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" data-testid="content-category-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City (Optional)</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger id="city" data-testid="content-city-select">
                          <SelectValue placeholder="Any city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any city</SelectItem>
                          {cities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>
                              {c.name}, {c.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger id="tone" data-testid="content-tone-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content-type">Content Type</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger id="content-type" data-testid="content-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_TYPES.map((ct) => (
                            <SelectItem key={ct} value={ct}>
                              {ct.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={generateContent}
                      disabled={generating || !category}
                      className="w-full bg-primary hover:bg-primary/90"
                      data-testid="generate-content-btn"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Generated Result */}
            <Card className="content-card" data-testid="generated-content-card">
              <CardHeader className="content-card-header">
                <CardTitle className="font-heading text-lg">Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="content-card-body">
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        value={generatedContent.content}
                        readOnly
                        className="min-h-32 resize-none"
                        data-testid="generated-content-text"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generatedContent.content, generatedContent.id)}
                        data-testid="copy-content-btn"
                      >
                        {copiedId === generatedContent.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Suggested Hashtags</Label>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="hashtag-pill"
                            onClick={() => copyToClipboard(`#${tag}`, `tag-${i}`)}
                            data-testid={`hashtag-${i}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Engagement Prediction:</Label>
                      <Badge
                        className={`engagement-${generatedContent.engagement_prediction}`}
                        data-testid="engagement-prediction"
                      >
                        {generatedContent.engagement_prediction.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your generated content will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content History */}
          <Card className="content-card" data-testid="content-history-card">
            <CardHeader className="content-card-header">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent className="content-card-body">
              {contentHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No content generated yet</p>
              ) : (
                <div className="space-y-4">
                  {contentHistory.slice(0, 5).map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      data-testid={`history-item-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm line-clamp-2">{item.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="badge-muted text-xs">
                              {item.category}
                            </Badge>
                            {item.city && (
                              <Badge variant="outline" className="badge-muted text-xs">
                                {item.city}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(item.content, `history-${item.id}`)}
                        >
                          {copiedId === `history-${item.id}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hashtag Generator Tab */}
        <TabsContent value="hashtags" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card className="content-card" data-testid="hashtag-form-card">
              <CardHeader className="content-card-header">
                <CardTitle className="font-heading text-lg">Hashtag Recommendations</CardTitle>
                <CardDescription>Get trending hashtags for your content</CardDescription>
              </CardHeader>
              <CardContent className="content-card-body space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-10" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hashtag-category">Category *</Label>
                      <Select value={hashtagCategory} onValueChange={setHashtagCategory}>
                        <SelectTrigger id="hashtag-category" data-testid="hashtag-category-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hashtag-city">City (Optional)</Label>
                      <Select value={hashtagCity} onValueChange={setHashtagCity}>
                        <SelectTrigger id="hashtag-city" data-testid="hashtag-city-select">
                          <SelectValue placeholder="Any city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any city</SelectItem>
                          {cities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>
                              {c.name}, {c.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hashtag-count">Number of Hashtags</Label>
                      <Input
                        id="hashtag-count"
                        type="number"
                        min={5}
                        max={20}
                        value={hashtagCount}
                        onChange={(e) => setHashtagCount(parseInt(e.target.value) || 10)}
                        data-testid="hashtag-count-input"
                      />
                    </div>

                    <Button
                      onClick={generateHashtags}
                      disabled={generatingHashtags || !hashtagCategory}
                      className="w-full bg-accent hover:bg-accent/90"
                      data-testid="generate-hashtags-btn"
                    >
                      {generatingHashtags ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Hash className="w-4 h-4 mr-2" />
                          Generate Hashtags
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Generated Hashtags */}
            <Card className="content-card" data-testid="generated-hashtags-card">
              <CardHeader className="content-card-header flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-lg">Recommended Hashtags</CardTitle>
                  {recommendedHashtags && (
                    <CardDescription>
                      {recommendedHashtags.category}
                      {recommendedHashtags.city && ` • ${recommendedHashtags.city}`}
                    </CardDescription>
                  )}
                </div>
                {recommendedHashtags && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllHashtags}
                    data-testid="copy-all-hashtags-btn"
                  >
                    {copiedId === "all-hashtags" ? (
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="content-card-body">
                {recommendedHashtags ? (
                  <div className="space-y-3">
                    {recommendedHashtags.hashtags.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(`#${item.tag}`, `rec-${index}`)}
                        data-testid={`recommended-hashtag-${index}`}
                      >
                        <span className="font-medium">#{item.tag}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              item.reach === "high"
                                ? "border-green-500 text-green-600"
                                : item.reach === "low"
                                ? "border-red-500 text-red-600"
                                : "border-yellow-500 text-yellow-600"
                            }`}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {item.reach}
                          </Badge>
                          {copiedId === `rec-${index}` && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your recommended hashtags will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
