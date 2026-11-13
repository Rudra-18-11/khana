export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface ItemOptionChoice {
  id: string;
  name: string;
  additionalPrice: number;
}

export interface ItemOptionGroup {
  id: string;
  groupName: string; // e.g. "Size", "Crust", "Add-ons"
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  choices: ItemOptionChoice[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isVeg: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  imageUrl: string;
  rating?: number;
  ratingCount?: number;
  hasCustomization?: boolean;
  optionGroups?: ItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  coverImage: string;
  logoImage?: string;
  rating: number;
  ratingCount: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  costForTwo: number;
  cuisines: string[];
  isPureVeg: boolean;
  isOpen: boolean;
  discountTag?: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  categories?: MenuCategory[];
}

export interface CartItemOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  additionalPrice: number;
}

export interface CartItem {
  cartItemId: string; // generated unique id based on item + selected options
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: CartItemOption[];
  unitPrice: number;
  totalPrice: number;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  isActive: boolean;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export type PaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderRider {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleNumber: string;
  avatarUrl: string;
  currentLat: number;
  currentLng: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  selectedOptions?: CartItemOption[];
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantImage: string;
  items: OrderItem[];
  deliveryAddress: Address;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemTotal: number;
  deliveryFee: number;
  taxesAndFees: number;
  discountAmount: number;
  tipAmount: number;
  grandTotal: number;
  appliedCoupon?: string;
  cookingInstructions?: string;
  rider?: OrderRider;
  deliveryOtp: string;
  estimatedDeliveryMinutes: number;
  placedAt: string;
  deliveredAt?: string;
}

export interface FilterState {
  searchQuery: string;
  selectedCuisine: string | null;
  isVegOnly: boolean;
  sortBy: 'relevance' | 'rating' | 'delivery_time' | 'cost_low_to_high' | 'cost_high_to_low';
  minRating: number | null; // e.g. 4.0
  hasOffersOnly: boolean;
}
