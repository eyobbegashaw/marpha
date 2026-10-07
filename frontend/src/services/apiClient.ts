export class ApiClient {
  private static getHeaders(isJson: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) headers['Content-Type'] = 'application/json';

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const tenantCode = localStorage.getItem('tenant_code');
    if (tenantCode) {
      headers['x-organization-code'] = tenantCode;
    }

    const lang = localStorage.getItem('app_language');
    if (lang) {
      headers['Accept-Language'] = lang;
    }

    return headers;
  }

  static async get<T = any>(url: string, params?: Record<string, any>): Promise<{ success: boolean; data: T; message?: string }> {
    const apiPath = url.startsWith('/api') ? url : `/api/v1${url.startsWith('/') ? url : `/${url}`}`;
    let fullUrl = apiPath;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.append(k, String(v));
      });
      const query = searchParams.toString();
      if (query) fullUrl += (fullUrl.includes('?') ? '&' : '?') + query;
    }

    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: this.getHeaders(false),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }
    return json;
  }

  static async post<T = any>(url: string, body?: any): Promise<{ success: boolean; data: T; message?: string }> {
    const apiPath = url.startsWith('/api') ? url : `/api/v1${url.startsWith('/') ? url : `/${url}`}`;
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }
    return json;
  }

  static async patch<T = any>(url: string, body?: any): Promise<{ success: boolean; data: T; message?: string }> {
    const apiPath = url.startsWith('/api') ? url : `/api/v1${url.startsWith('/') ? url : `/${url}`}`;
    const res = await fetch(apiPath, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }
    return json;
  }

  static async put<T = any>(url: string, body?: any): Promise<{ success: boolean; data: T; message?: string }> {
    const apiPath = url.startsWith('/api') ? url : `/api/v1${url.startsWith('/') ? url : `/${url}`}`;
    const res = await fetch(apiPath, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }
    return json;
  }
}

export const apiClient = {
  get: ApiClient.get.bind(ApiClient),
  post: ApiClient.post.bind(ApiClient),
  patch: ApiClient.patch.bind(ApiClient),
  put: ApiClient.put.bind(ApiClient),
};
