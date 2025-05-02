class UserService {
  private readonly USER_ID_KEY = 'user_id';

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  setUserId(userId: string): void {
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  removeUserId(): void {
    localStorage.removeItem(this.USER_ID_KEY);
  }

  hasUserId(): boolean {
    return !!this.getUserId();
  }
}

export const userService = new UserService();
