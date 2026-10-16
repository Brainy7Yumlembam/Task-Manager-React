import {
  getAuth,
  signInAnonymously as fbSignInAnonymously,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User,
} from '@react-native-firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

export type AuthStateCallback = (user: AppUser | null) => void;

class FirebaseAuthService {
  private currentUser: AppUser | null = null;
  private isFirebaseConfigured = true;

  constructor() {
    this.checkConfig();
  }

  private checkConfig(): void {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        this.currentUser = this.formatUser(user);
      }
    } catch (e: any) {
      console.warn('[FirebaseAuthService] Firebase Auth not fully configured or offline:', e?.message);
      this.isFirebaseConfigured = false;
    }
  }

  public isConfigured(): boolean {
    return this.isFirebaseConfigured;
  }

  private formatUser(user: User): AppUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (user.isAnonymous ? 'Guest User' : user.email?.split('@')[0] || 'User'),
      isAnonymous: user.isAnonymous,
    };
  }

  public getCurrentUser(): AppUser | null {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        this.currentUser = this.formatUser(user);
        return this.currentUser;
      }
    } catch {
      // In unconfigured or offline mode
    }
    return this.currentUser;
  }

  public onAuthStateChanged(callback: AuthStateCallback): () => void {
    try {
      const auth = getAuth();
      const unsubscribe = fbOnAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          const appUser = this.formatUser(user);
          this.currentUser = appUser;
          callback(appUser);
        } else {
          this.currentUser = null;
          callback(null);
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn('[FirebaseAuthService] Auth listener failed to register:', e);
      callback(this.currentUser);
      return () => {};
    }
  }

  public async signInAnonymously(): Promise<AppUser> {
    const auth = getAuth();
    const cred = await fbSignInAnonymously(auth);
    const appUser = this.formatUser(cred.user);
    this.currentUser = appUser;
    return appUser;
  }

  public async signInWithEmail(email: string, pass: string): Promise<AppUser> {
    const auth = getAuth();
    const cred = await fbSignInWithEmailAndPassword(auth, email.trim(), pass);
    const appUser = this.formatUser(cred.user);
    this.currentUser = appUser;
    return appUser;
  }

  public async signUpWithEmail(email: string, pass: string): Promise<AppUser> {
    const auth = getAuth();
    const cred = await fbCreateUserWithEmailAndPassword(auth, email.trim(), pass);
    const appUser = this.formatUser(cred.user);
    this.currentUser = appUser;
    return appUser;
  }

  public async signOut(): Promise<void> {
    const auth = getAuth();
    await fbSignOut(auth);
    this.currentUser = null;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
