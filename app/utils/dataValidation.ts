/**
 * Comprehensive Data Validation System
 * 
 * Provides robust validation for trading data, model inputs, and user inputs
 * to ensure data integrity and prevent errors.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TradeValidationData {
  pairName: string;
  entryPrice: number;
  exitPrice?: number;
  investment: number;
  type: 'buy' | 'sell';
  date: string;
  status: 'pending' | 'won' | 'lost';
}

export interface SessionValidationData {
  capital: number;
  totalTrades: number;
  accuracy: number;
  riskRewardRatio: number;
}

export class DataValidator {
  private static readonly MIN_CAPITAL = 1;
  private static readonly MAX_CAPITAL = 10000000; // $10M
  private static readonly MIN_TRADES = 1;
  private static readonly MAX_TRADES = 1000;
  private static readonly MIN_ACCURACY = 0;
  private static readonly MAX_ACCURACY = 100;
  private static readonly MIN_RR = 0.1;
  private static readonly MAX_RR = 50;
  private static readonly MIN_PRICE = 0.000001;
  private static readonly MAX_PRICE = 1000000;
  private static readonly MIN_INVESTMENT = 0.01;
  private static readonly MAX_INVESTMENT = 1000000;

  /**
   * Validate trading session parameters
   */
  public static validateSession(data: SessionValidationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Capital validation
    if (data.capital < this.MIN_CAPITAL) {
      errors.push(`Capital must be at least $${this.MIN_CAPITAL}`);
    }
    if (data.capital > this.MAX_CAPITAL) {
      errors.push(`Capital cannot exceed $${this.MAX_CAPITAL.toLocaleString()}`);
    }
    if (!Number.isFinite(data.capital)) {
      errors.push('Capital must be a valid number');
    }

    // Total trades validation
    if (data.totalTrades < this.MIN_TRADES) {
      errors.push(`Total trades must be at least ${this.MIN_TRADES}`);
    }
    if (data.totalTrades > this.MAX_TRADES) {
      errors.push(`Total trades cannot exceed ${this.MAX_TRADES}`);
    }
    if (!Number.isInteger(data.totalTrades)) {
      errors.push('Total trades must be a whole number');
    }

    // Accuracy validation
    if (data.accuracy < this.MIN_ACCURACY) {
      errors.push('Accuracy cannot be negative');
    }
    if (data.accuracy > this.MAX_ACCURACY) {
      errors.push('Accuracy cannot exceed 100%');
    }
    if (!Number.isFinite(data.accuracy)) {
      errors.push('Accuracy must be a valid number');
    }

    // Risk-reward ratio validation
    if (data.riskRewardRatio < this.MIN_RR) {
      errors.push(`Risk-reward ratio must be at least ${this.MIN_RR}`);
    }
    if (data.riskRewardRatio > this.MAX_RR) {
      errors.push(`Risk-reward ratio cannot exceed ${this.MAX_RR}`);
    }
    if (!Number.isFinite(data.riskRewardRatio)) {
      errors.push('Risk-reward ratio must be a valid number');
    }

    // Business logic warnings
    if (data.accuracy < 50) {
      warnings.push('Accuracy below 50% may result in losses');
    }
    if (data.riskRewardRatio < 1) {
      warnings.push('Risk-reward ratio below 1:1 is not recommended');
    }
    if (data.totalTrades > 100) {
      warnings.push('High number of trades may increase complexity');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate individual trade data
   */
  public static validateTrade(data: TradeValidationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Pair name validation
    if (!data.pairName || data.pairName.trim().length === 0) {
      errors.push('Trading pair name is required');
    } else if (data.pairName.length > 20) {
      errors.push('Trading pair name is too long (max 20 characters)');
    } else if (!/^[A-Z0-9/]+$/.test(data.pairName)) {
      errors.push('Trading pair name should contain only uppercase letters, numbers, and forward slash');
    }

    // Entry price validation
    if (data.entryPrice <= 0) {
      errors.push('Entry price must be greater than 0');
    }
    if (data.entryPrice < this.MIN_PRICE) {
      errors.push(`Entry price must be at least ${this.MIN_PRICE}`);
    }
    if (data.entryPrice > this.MAX_PRICE) {
      errors.push(`Entry price cannot exceed ${this.MAX_PRICE.toLocaleString()}`);
    }
    if (!Number.isFinite(data.entryPrice)) {
      errors.push('Entry price must be a valid number');
    }

    // Exit price validation (if provided)
    if (data.exitPrice !== undefined) {
      if (data.exitPrice <= 0) {
        errors.push('Exit price must be greater than 0');
      }
      if (data.exitPrice < this.MIN_PRICE) {
        errors.push(`Exit price must be at least ${this.MIN_PRICE}`);
      }
      if (data.exitPrice > this.MAX_PRICE) {
        errors.push(`Exit price cannot exceed ${this.MAX_PRICE.toLocaleString()}`);
      }
      if (!Number.isFinite(data.exitPrice)) {
        errors.push('Exit price must be a valid number');
      }
    }

    // Investment validation
    if (data.investment <= 0) {
      errors.push('Investment amount must be greater than 0');
    }
    if (data.investment < this.MIN_INVESTMENT) {
      errors.push(`Investment must be at least $${this.MIN_INVESTMENT}`);
    }
    if (data.investment > this.MAX_INVESTMENT) {
      errors.push(`Investment cannot exceed $${this.MAX_INVESTMENT.toLocaleString()}`);
    }
    if (!Number.isFinite(data.investment)) {
      errors.push('Investment must be a valid number');
    }

    // Type validation
    if (!['buy', 'sell'].includes(data.type)) {
      errors.push('Trade type must be either "buy" or "sell"');
    }

    // Date validation
    if (!data.date) {
      errors.push('Trade date is required');
    } else {
      const tradeDate = new Date(data.date);
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      if (isNaN(tradeDate.getTime())) {
        errors.push('Invalid date format');
      } else if (tradeDate > now) {
        errors.push('Trade date cannot be in the future');
      } else if (tradeDate < oneYearAgo) {
        warnings.push('Trade date is more than one year ago');
      }
    }

    // Status validation
    if (!['pending', 'won', 'lost'].includes(data.status)) {
      errors.push('Trade status must be "pending", "won", or "lost"');
    }

    // Business logic warnings
    if ((data.status === 'won' || data.status === 'lost') && !data.exitPrice) {
      warnings.push('Completed trades should have an exit price');
    }
    if (data.status === 'pending' && data.exitPrice) {
      warnings.push('Pending trades should not have an exit price');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate neural network training data
   */
  public static validateTrainingData(data: Array<{
    capital: number;
    totalTrades: number;
    accuracy: number;
    riskRewardRatio: number;
    expectedProfit: number;
  }>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length === 0) {
      errors.push('Training data cannot be empty');
      return { isValid: false, errors, warnings };
    }

    if (data.length < 5) {
      warnings.push('At least 5 training samples are recommended for good model performance');
    }

    // Validate each training sample
    data.forEach((sample, index) => {
      const sessionValidation = this.validateSession({
        capital: sample.capital,
        totalTrades: sample.totalTrades,
        accuracy: sample.accuracy,
        riskRewardRatio: sample.riskRewardRatio
      });

      if (!sessionValidation.isValid) {
        errors.push(`Training sample ${index + 1}: ${sessionValidation.errors.join(', ')}`);
      }

      // Expected profit validation
      if (!Number.isFinite(sample.expectedProfit)) {
        errors.push(`Training sample ${index + 1}: Expected profit must be a valid number`);
      }
      if (sample.expectedProfit < 0) {
        warnings.push(`Training sample ${index + 1}: Negative expected profit may indicate data issues`);
      }
      if (sample.expectedProfit > sample.capital * 100) {
        warnings.push(`Training sample ${index + 1}: Expected profit seems unusually high`);
      }
    });

    // Check for data diversity
    const uniqueCapitals = new Set(data.map(d => d.capital)).size;
    const uniqueAccuracies = new Set(data.map(d => d.accuracy)).size;
    const uniqueRRs = new Set(data.map(d => d.riskRewardRatio)).size;

    if (uniqueCapitals < 2) {
      warnings.push('Training data should include different capital amounts');
    }
    if (uniqueAccuracies < 3) {
      warnings.push('Training data should include different accuracy levels');
    }
    if (uniqueRRs < 3) {
      warnings.push('Training data should include different risk-reward ratios');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize user input to prevent XSS and other security issues
   */
  public static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate file upload (for CSV imports)
   */
  public static validateFileUpload(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File type validation
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only CSV files are allowed');
    }

    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('File size cannot exceed 10MB');
    }

    // File name validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('File must have .csv extension');
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate numeric input with custom bounds
   */
  public static validateNumericInput(
    value: string | number,
    min: number = -Infinity,
    max: number = Infinity,
    allowDecimals: boolean = true
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      errors.push('Value must be a valid number');
    } else {
      if (numValue < min) {
        errors.push(`Value must be at least ${min}`);
      }
      if (numValue > max) {
        errors.push(`Value cannot exceed ${max}`);
      }
      if (!allowDecimals && !Number.isInteger(numValue)) {
        errors.push('Value must be a whole number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate email format
   */
  public static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    } else if (email.length > 254) {
      errors.push('Email is too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate password strength
   */
  public static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!password || password.length === 0) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (password.length > 128) {
        errors.push('Password is too long');
      }
      if (!/[A-Z]/.test(password)) {
        warnings.push('Password should contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        warnings.push('Password should contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        warnings.push('Password should contain at least one number');
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        warnings.push('Password should contain at least one special character');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export utility functions for common validations
export const validateSession = DataValidator.validateSession;
export const validateTrade = DataValidator.validateTrade;
export const validateTrainingData = DataValidator.validateTrainingData;
export const sanitizeInput = DataValidator.sanitizeInput;
export const validateFileUpload = DataValidator.validateFileUpload;
export const validateNumericInput = DataValidator.validateNumericInput;
export const validateEmail = DataValidator.validateEmail;
export const validatePassword = DataValidator.validatePassword;









