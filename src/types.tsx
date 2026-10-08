export interface LoginFormData {
    login: string;
    password: string;
  }
  
  export interface LoginFormProps {
    onSubmit?: (data: LoginFormData) => void;
  }
  export interface RegisterFormData {
    lastName: string;
    firstName: string;
    login: string;
    password: string;
    email: string;
    phone: string;
  }
  interface Promotion {
    id: number;
    title: string;
    description: string;
    discount: string;
    image: string;
    size: 'large' | 'small';
  }
  
  interface MainPageProps {
    promotions?: Promotion[];
  }
  export interface LoginFormData {
    login: string;
    password: string;
  }
  
  export interface User {
    id: number;
    login: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: 'Client' | 'Admin';
    email?: string;
    phone?: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
  }