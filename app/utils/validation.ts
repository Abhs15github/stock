export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must include at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must include at least one lowercase letter" };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must include at least one digit" };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: "Password must include at least one special character" };
  }

  return { isValid: true, message: "Password is valid" };
};

export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "Email is valid" };
};

export const validateSessionData = (data: {
  name: string;
  capital: number;
  totalTrades: number;
  accuracy: number;
  riskRewardRatio: number;
}): { isValid: boolean; message: string } => {
  if (!data.name.trim()) {
    return { isValid: false, message: "Session name is required" };
  }

  if (data.capital <= 0) {
    return { isValid: false, message: "Capital must be greater than 0" };
  }

  if (data.totalTrades <= 0) {
    return { isValid: false, message: "Total trades must be greater than 0" };
  }

  if (data.accuracy < 0 || data.accuracy > 100) {
    return { isValid: false, message: "Accuracy must be between 0 and 100%" };
  }

  if (data.riskRewardRatio <= 0) {
    return { isValid: false, message: "Risk-reward ratio must be greater than 0" };
  }

  return { isValid: true, message: "Session data is valid" };
};