/**
 * API Client for RezaPro Backend
 * Handles all API communication with the backend
 */

// Ensure API_BASE_URL always ends with /api
const getApiBaseUrl = () => {
  // In browser, check if we should use relative URLs (for Next.js rewrites)
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const currentOrigin = window.location.origin;
    
    // If no explicit backend URL is set, use relative URL so Next.js rewrite can handle it
    if (!envUrl) {
      return '/api';
    }
    
    // Check if backend URL is on the same origin (for Next.js rewrites to work)
    try {
      const envUrlObj = new URL(envUrl);
      
      // If same origin, use relative URL for rewrite to work
      if (envUrlObj.origin === currentOrigin) {
        return '/api';
      }
      
      // Local backend URL from any localhost frontend port → use relative so Next rewrite proxies
      if (
        (envUrl === 'http://localhost:5000/api' || envUrl === 'http://127.0.0.1:5000/api') &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(currentOrigin)
      ) {
        return '/api';
      }
    } catch (e) {
      // If URL parsing fails, fall through to absolute URL
    }
  }
  
  // For server-side or different origin, use absolute URL
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://api.reza.ma/api';
  // Remove trailing slash if present
  const cleanUrl = url.replace(/\/$/, '');
  // Ensure /api suffix is present
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  error: string;
  message: string;
}


class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    console.log('[API] setToken called:', { hasToken: !!token, tokenLength: token?.length });
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      console.log('[API] Token saved to localStorage');
      // Verify it was saved
      const saved = localStorage.getItem('token');
      console.log('[API] Verification - token in localStorage:', !!saved, saved?.substring(0, 20));
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      console.log('[API] Token removed from localStorage');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Always refresh token from localStorage on each request to ensure it's up to date
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken !== this.token) {
        this.token = storedToken;
      }
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Get current token (always check localStorage to ensure it's fresh)
    let currentToken: string | null = null;
    if (typeof window !== 'undefined') {
      currentToken = localStorage.getItem('token');
      // Update instance token if different
      if (currentToken !== this.token) {
        this.token = currentToken;
      }
    } else {
      currentToken = this.token;
    }
    
    // Debug: Log token status for first few requests
    if (typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
      const debugKey = '__api_debug_count';
      const count = (window as any)[debugKey] || 0;
      if (count < 3) {
        console.log(`[API Debug ${count + 1}] Request to ${endpoint}:`, {
          hasToken: !!currentToken,
          tokenLength: currentToken?.length || 0,
          localStorageHasToken: !!localStorage.getItem('token'),
          instanceHasToken: !!this.token
        });
        (window as any)[debugKey] = count + 1;
      }
    }
      
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    } else {
      // Only log warning for non-auth endpoints to avoid spam
      if (!endpoint.includes('/auth/')) {
        console.error(`[API] No token found for request to: ${endpoint}. Please log in again.`);
        console.error(`[API] localStorage.getItem('token'):`, typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A');
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (fetchError: any) {
      // Handle network errors (CORS, connection refused, etc.)
      const networkError = new Error(
        fetchError?.message || 'Network error: Unable to connect to server. Please check if the server is running.'
      ) as any;
      networkError.name = fetchError?.name || 'NetworkError';
      networkError.status = 0;
      networkError.statusText = 'Network Error';
      networkError.originalError = fetchError;
      throw networkError;
    }

    // Clone response for error handling (response body can only be read once)
    const responseClone = response.clone();
    
    if (!response.ok) {
      // If unauthorized, clear token (but only if we had a token to begin with)
      if (response.status === 401) {
        // Only clear token if we actually had one - avoids clearing on legitimate "not logged in" scenarios
        if (this.token || (typeof window !== 'undefined' && localStorage.getItem('token'))) {
          console.warn('Token expired or invalid, clearing authentication');
          this.setToken(null);
        }
        // Don't redirect automatically - let the app handle it
      }
      
      let errorMessage: string = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        // Try to get error message from response
        const contentType = responseClone.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await responseClone.json();
          // Handle different error response formats
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (errorData?.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
          }
        } else {
          // Try to get text response
          const text = await responseClone.text();
          if (text && text.trim()) {
            errorMessage = text;
          }
        }
      } catch (parseError) {
        // If parsing fails, use default message
        console.error('Error parsing error response:', parseError);
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      throw error;
    }

    // Handle successful responses
    const contentType = response.headers.get('content-type');
    
    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || !contentType) {
      return {} as T;
    }
    
    // Parse JSON response
    if (contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return {} as T;
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
    }
    
    // For other content types, return empty object
    return {} as T;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    console.log('[API] Login called for:', email);
    try {
      const data = await this.request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('[API] Login response received:', { hasToken: !!data.token, hasUser: !!data.user });
      if (data.token) {
        this.setToken(data.token);
        console.log('[API] Token set after login, verifying:', localStorage.getItem('token') ? 'Token exists' : 'Token missing');
      } else {
        console.error('[API] No token in login response!', data);
      }
      return data;
    } catch (error: any) {
      // Enhanced error logging to handle all error types
      const errorInfo: any = {
        type: error?.constructor?.name || typeof error,
        message: error?.message || String(error),
        status: error?.status,
        statusText: error?.statusText,
        name: error?.name,
        stack: error?.stack,
      };
      
      // Add fetch-specific error information
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorInfo.networkError = true;
        errorInfo.details = 'Network error - check if server is running and CORS is configured';
      }
      
      // Log the full error object for debugging
      console.error('[API] Login error:', errorInfo);
      console.error('[API] Full error object:', error);
      
      // Re-throw with a more user-friendly message if needed
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    createTenant?: boolean;
    tenantName?: string;
    tenantEmail?: string;
    tenantCity?: string;
  }) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async verifyEmail(token: string, email: string) {
    return this.request<{ message: string; emailVerified: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token, email }),
    });
  }

  async resendVerificationEmail(email: string) {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Client endpoints
  async getClients(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request<any>(`/clients?${query.toString()}`);
  }

  async getClient(id: string) {
    return this.request<any>(`/clients/${id}`);
  }

  async createClient(clientData: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: string, clientData: any) {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: string) {
    return this.request<any>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Duplicate detection and merging
  async getDuplicateClients() {
    return this.request<any>('/clients/duplicates');
  }

  async mergeClients(primaryClientId: string, duplicateClientIds: string[]) {
    return this.request<any>('/clients/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryClientId, duplicateClientIds }),
    });
  }

  async getTopClients(params?: {
    limit?: number;
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/clients/top?${query.toString()}`);
  }

  async getNewClientsStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/clients/new?${query.toString()}`);
  }

  async getClientFrequencyStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/clients/frequency?${query.toString()}`);
  }

  // Service endpoints
  async getServices(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.request<any>(`/services${queryString ? `?${queryString}` : ''}`);
  }

  async getService(id: string) {
    return this.request<any>(`/services/${id}`);
  }

  async createService(serviceData: any) {
    return this.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: any) {
    return this.request<any>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: string) {
    return this.request<any>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Employee endpoints
  async getEmployees(params?: { active?: boolean; search?: string }) {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.append('active', params.active.toString());
    if (params?.search) query.append('search', params.search);
    return this.request<any>(`/employees?${query.toString()}`);
  }

  async getEmployee(id: string) {
    return this.request<any>(`/employees/${id}`);
  }

  async createEmployee(employeeData: any) {
    return this.request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.request<any>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id: string) {
    return this.request<any>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    clientId?: string;
    employeeId?: string;
    serviceId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.serviceId) query.append('serviceId', params.serviceId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request<any>(`/appointments?${query.toString()}`);
  }

  async getAppointment(id: string) {
    return this.request<any>(`/appointments/${id}`);
  }

  async createAppointment(appointmentData: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id: string, appointmentData: any) {
    return this.request<any>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<any>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoice endpoints
  async getInvoices(params?: {
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request<any>(`/invoices?${query.toString()}`);
  }

  async getInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }

  async createInvoice(invoiceData: any) {
    return this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(id: string, invoiceData: any) {
    return this.request<any>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  // Review endpoints
  async getReviews(params?: { status?: string; clientId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request<any>(`/reviews?${query.toString()}`);
  }

  async createReview(reviewData: any) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async moderateReview(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    return this.request<any>(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Dashboard review endpoints
  async getApprovedReviews() {
    return this.request<any>('/dashboard/clients/mes-avis/avis-moderes');
  }

  async getRejectedReviews() {
    return this.request<any>('/dashboard/clients/mes-avis/avis-refuses');
  }

  async getReviewStatistics() {
    return this.request<any>('/dashboard/clients/mes-avis/statistiques-avis');
  }

  // Statistics endpoints
  async getStatsOverview(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return this.request<any>(`/stats/overview?${query.toString()}`);
  }

  async getAppointmentStats(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return this.request<any>(`/stats/appointments?${query.toString()}`);
  }

  async getRevenueStats(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return this.request<any>(`/stats/revenue?${query.toString()}`);
  }

  // Tenant endpoints
  async getTenant() {
    return this.request<any>('/tenant');
  }

  async updateTenant(tenantData: any) {
    return this.request<any>('/tenant', {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async uploadCoverImage(file: File): Promise<{ coverImage: string }> {
    const formData = new FormData();
    formData.append('coverImage', file);

    const url = `${this.baseURL}/tenant/upload-cover-image`;
    const headers: HeadersInit = {};

    // Get current token (refresh from localStorage if needed)
    const currentToken = this.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Upload failed',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.message || 'Failed to upload cover image');
    }

    return response.json();
  }

  async uploadHeaderImage(file: File): Promise<{ headerImage: string }> {
    console.log('[API] uploadHeaderImage called:', { fileName: file.name, fileSize: file.size, fileType: file.type });
    const formData = new FormData();
    formData.append('headerImage', file);

    const url = `${this.baseURL}/tenant/upload-header-image`;
    const headers: HeadersInit = {};

    // Get current token (refresh from localStorage if needed)
    const currentToken = this.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
      console.log('[API] Token found for header image upload');
    } else {
      console.error('[API] No token found for header image upload!');
    }

    console.log('[API] Uploading to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('[API] Upload response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Upload failed, response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = {
          error: 'Upload failed',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      throw new Error(error.message || error.error || 'Failed to upload header image');
    }

    const result = await response.json();
    console.log('[API] Upload successful, result:', result);
    return result;
  }

  async getHeaderImage(): Promise<{ headerImage: string | null }> {
    console.log('[API] ========== getHeaderImage called ==========');
    console.log('[API] getHeaderImage - baseURL:', this.baseURL);
    console.log('[API] getHeaderImage - endpoint: /tenant/header-image');
    console.log('[API] getHeaderImage - full URL will be:', `${this.baseURL}/tenant/header-image`);
    try {
      // Use query parameter to prevent caching instead of headers (to avoid CORS issues)
      const cacheBuster = `?t=${Date.now()}`;
      const response = await this.request<{ headerImage: string | null }>(`/tenant/header-image${cacheBuster}`, {
        method: 'GET'
      });
      console.log('[API] getHeaderImage response received:', response);
      console.log('[API] getHeaderImage - response type:', typeof response);
      console.log('[API] getHeaderImage - headerImage value:', response.headerImage);
      console.log('[API] getHeaderImage - headerImage type:', typeof response.headerImage);
      return response;
    } catch (error) {
      console.error('[API] getHeaderImage error:', error);
      console.error('[API] getHeaderImage error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        statusText: (error as any)?.statusText
      });
      throw error;
    }
  }

  async getTenantSettings() {
    return this.request<any>('/tenant/settings');
  }

  async updateTenantSettings(settings: any) {
    return this.request<any>('/tenant/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Establishment description endpoints
  async getEstablishmentDescription() {
    const settings = await this.getTenantSettings();
    return { description: settings.settings?.description || '' };
  }

  async updateEstablishmentDescription(description: string) {
    return this.request<any>('/tenant/settings', {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  // Appointment notification emails endpoints
  async getAppointmentNotificationEmails() {
    const response = await this.request<{ emails: string[] }>('/tenant/notifications/appointment-emails');
    return { emails: response.emails || [] };
  }

  async updateAppointmentNotificationEmails(emails: string[]) {
    return this.request<{ emails: string[] }>('/tenant/notifications/appointment-emails', {
      method: 'PUT',
      body: JSON.stringify({ emails }),
    });
  }

  // Notification endpoints
  async getNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request<{ notifications: any[]; grouped: any; unreadCount: number }>(
      `/notifications${queryString ? `?${queryString}` : ''}`
    );
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Business hours and scheduling endpoints
  async getBusinessHours() {
    return this.request<any>('/tenant/settings/business-hours');
  }

  async updateBusinessHours(data: {
    onlineBooking?: 'open' | 'closed';
    schedules?: any[];
    exceptionalSchedules?: any[];
    agendaStart?: string;
    agendaEnd?: string;
    bookingDelay?: any;
    cancellationDelay?: any;
    advanceBooking?: any;
  }) {
    return this.request<any>('/tenant/settings/business-hours', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Message settings endpoints
  async getMessageSettings() {
    return this.request<{ enabled: boolean; content: string }>('/tenant/settings/message');
  }

  async updateMessageSettings(enabled: boolean, content: string) {
    return this.request<any>('/tenant/settings/message', {
      method: 'PUT',
      body: JSON.stringify({ enabled, content }),
    });
  }

  // Waiting list settings endpoints
  async getWaitingListSettings() {
    return this.request<{ activated: boolean }>('/tenant/settings/waiting-list');
  }

  async updateWaitingListSettings(activated: boolean) {
    return this.request<any>('/tenant/settings/waiting-list', {
      method: 'PUT',
      body: JSON.stringify({ activated }),
    });
  }

  // Client field settings endpoints
  async getClientFieldSettings() {
    return this.request<{ fields: any[] }>('/tenant/settings/client-fields');
  }

  async updateClientFieldSettings(fields: any[]) {
    return this.request<any>('/tenant/settings/client-fields', {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  // Dashboard statistics endpoints
  async getDashboardStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/dashboard?${query.toString()}`);
  }

  // Autres statistics endpoints
  async getAutresStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/autres?${query.toString()}`);
  }

  // Prestations statistics endpoints
  async getPrestationsStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/prestations?${query.toString()}`);
  }

  // Collaborateurs statistics endpoints
  async getCollaborateursStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/collaborateurs?${query.toString()}`);
  }

  // RDV daily statistics endpoints
  async getRdvStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/rdv?${query.toString()}`);
  }

  // RDV Pas Venus statistics endpoints
  async getRdvPasVenusStats(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/rdv-pas-venus?${query.toString()}`);
  }

  // Occupation statistics endpoints
  async getOccupationVueEnsemble(params?: {
    month?: number;
    year?: number;
    employeeId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    return this.request<any>(`/stats/occupation/vue-ensemble?${query.toString()}`);
  }

  async getOccupationCollaborateurs(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    return this.request<any>(`/stats/occupation/collaborateurs?${query.toString()}`);
  }

  async getOccupationPrestations(params?: {
    month?: number;
    year?: number;
    employeeId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.month !== undefined) query.append('month', params.month.toString());
    if (params?.year !== undefined) query.append('year', params.year.toString());
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    return this.request<any>(`/stats/occupation/prestations?${query.toString()}`);
  }

  // Payment methods endpoints
  async getPaymentMethods() {
    return this.request<any>('/tenant/payment-methods');
  }

  async addPaymentMethod(data: {
    type: 'moroccan_transfer' | 'card';
    iban?: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvc?: string;
    last4?: string;
  }) {
    return this.request<any>('/tenant/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentMethod(id: string, data: { isDefault?: boolean }) {
    return this.request<any>(`/tenant/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: string) {
    return this.request<any>(`/tenant/payment-methods/${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointmentDisplaySettings() {
    return this.request<any>('/tenant/settings/appointment-display');
  }

  async updateAppointmentDisplaySettings(settings: { showColorInRDV: boolean; fields: any[] }) {
    return this.request<any>('/tenant/settings/appointment-display', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Photo endpoints
  async getPhotos() {
    return this.request<any>('/tenant/photos');
  }

  async uploadPhotos(photos: any[]) {
    return this.request<any>('/tenant/photos', {
      method: 'POST',
      body: JSON.stringify({ photos }),
    });
  }

  async updatePhoto(id: string, updates: any) {
    return this.request<any>(`/tenant/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePhoto(id: string) {
    return this.request<any>(`/tenant/photos/${id}`, {
      method: 'DELETE',
    });
  }

  async deletePhotos(ids: string[]) {
    return this.request<any>('/tenant/photos', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  // Cash Transaction endpoints
  async getCashTransactions(params?: {
    startDate?: string;
    endDate?: string;
    type?: 'DEPOSIT' | 'WITHDRAWAL' | 'all';
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return this.request<any>(`/cash-transactions?${query.toString()}`);
  }

  async getCashTransaction(id: string) {
    return this.request<any>(`/cash-transactions/${id}`);
  }

  async createCashTransaction(transactionData: {
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE';
    notes?: string;
  }) {
    return this.request<any>('/cash-transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteCashTransaction(id: string) {
    return this.request<any>(`/cash-transactions/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

