import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkListener = (isConnected: boolean) => void;

class NetworkService {
  private isOnline = true;
  private listeners: Set<NetworkListener> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
        const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
        const changed = this.isOnline !== connected;
        this.isOnline = connected;

        if (changed) {
          this.notifyListeners(connected);
        }
      });
    } catch (err) {
      console.warn('[NetworkService] Failed to bind NetInfo listener:', err);
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      return this.isOnline;
    } catch {
      return this.isOnline;
    }
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediately inform current status
    listener(this.isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(connected: boolean): void {
    this.listeners.forEach(fn => {
      try {
        fn(connected);
      } catch (e) {
        console.error('[NetworkService] Error in listener callback:', e);
      }
    });
  }

  public cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners.clear();
  }
}

export const networkService = new NetworkService();
