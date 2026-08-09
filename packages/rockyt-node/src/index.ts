export interface RockytOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ConnectAccountOptions {
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'x' | 'youtube' | 'threads' | 'pinterest' | 'bluesky' | 'whatsapp' | 'telegram' | 'discord' | 'google' | string;
  profileId: string;
  redirectUrl?: string;
}

export interface ConnectAccountResponse {
  authUrl: string;
  sessionId: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  altText?: string;
}

export interface PlatformTarget {
  platform: string;
  accountId: string;
}

export interface CreatePostOptions {
  content: string;
  mediaItems?: MediaItem[];
  platforms: PlatformTarget[];
  scheduleAt?: string;
}

export interface CreatePostResponse {
  postId: string;
  status: 'published' | 'scheduled' | 'processing';
  results: Array<{
    platform: string;
    status: 'success' | 'failed';
    postUrl?: string;
    error?: string;
  }>;
}

export interface SendMessageOptions {
  to: string;
  text: string;
  platform?: 'whatsapp' | 'telegram' | 'discord' | string;
}

export interface SendMessageResponse {
  messageId: string;
  status: 'sent' | 'queued';
}

export interface AnalyticsOptions {
  profileId?: string;
  timeframe?: '24h' | '7d' | '30d' | '90d';
}

export interface AnalyticsResponse {
  impressions: number;
  engagements: number;
  clicks: number;
  roas?: number;
}

export interface PurchasePhoneOptions {
  profileId: string;
  country: string;
}

export interface PurchasePhoneResponse {
  phoneNumber: string;
  status: 'active';
}

export class Rockyt {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: string | RockytOptions) {
    if (typeof options === 'string') {
      this.apiKey = options;
      this.baseUrl = 'https://rockyt.io';
    } else {
      this.apiKey = options.apiKey;
      this.baseUrl = options.baseUrl || 'https://rockyt.io';
    }

    if (!this.apiKey) {
      throw new Error('Rockyt API key is required. Pass it via new Rockyt("YOUR_API_KEY")');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Rockyt-Node-SDK/1.0.0',
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Rockyt API Error (${res.status}): ${errText}`);
    }

    return res.json() as Promise<T>;
  }

  public accounts = {
    connect: async (options: ConnectAccountOptions): Promise<ConnectAccountResponse> => {
      return this.request<ConnectAccountResponse>('/api/v1/accounts/connect', {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },
  };

  public posts = {
    create: async (options: CreatePostOptions): Promise<CreatePostResponse> => {
      return this.request<CreatePostResponse>('/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },
    list: async (options?: { profileId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (options?.profileId) params.set('profileId', options.profileId);
      if (options?.limit) params.set('limit', String(options.limit));
      return this.request(`/api/v1/posts?${params.toString()}`, {
        method: 'GET',
      });
    },
  };

  public messaging = {
    sendMessage: async (options: SendMessageOptions): Promise<SendMessageResponse> => {
      return this.request<SendMessageResponse>('/api/v1/messaging/send', {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },
  };

  public analytics = {
    getMetrics: async (options?: AnalyticsOptions): Promise<AnalyticsResponse> => {
      const params = new URLSearchParams();
      if (options?.profileId) params.set('profileId', options.profileId);
      if (options?.timeframe) params.set('timeframe', options.timeframe);
      return this.request<AnalyticsResponse>(`/api/v1/analytics/metrics?${params.toString()}`, {
        method: 'GET',
      });
    },
  };
}

export default Rockyt;
