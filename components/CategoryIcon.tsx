
import React from 'react';
import { 
  ShoppingCart, Bus, Home, Film, Heart, Briefcase, Gift, 
  MoreHorizontal, Utensils, Car, Zap, Wifi, Smartphone, 
  Coffee, Book, Music, Dumbbell, Plane, PawPrint, CircleHelp,
  ArrowRightLeft, Wallet, CreditCard, Banknote, Landmark, 
  PiggyBank, Coins, Vault,
  // New icons
  Shirt, GraduationCap, Baby, Gamepad2, Tv, Hammer, Wrench,
  Stethoscope, Pill, Fuel, Bike, Train, Flower, Scissors,
  Laptop, Sofa, Palette, Trophy, HandCoins, Gem, Bath, Thermometer,
  Droplet, Lightbulb, Pizza, Beer, Flame, Sun
} from 'lucide-react';

export const ICON_MAP: { [key: string]: React.ElementType } = {
  // Original set
  'shopping-cart': ShoppingCart,
  'bus': Bus,
  'home': Home,
  'film': Film,
  'heart': Heart,
  'briefcase': Briefcase,
  'gift': Gift,
  'utensils': Utensils,
  'car': Car,
  'zap': Zap,
  'wifi': Wifi,
  'smartphone': Smartphone,
  'coffee': Coffee,
  'book': Book,
  'music': Music,
  'dumbbell': Dumbbell,
  'plane': Plane,
  'paw-print': PawPrint,
  'more-horizontal': MoreHorizontal,
  'transfer': ArrowRightLeft,
  
  // Finance Icons
  'wallet': Wallet,
  'credit-card': CreditCard,
  'banknote': Banknote,
  'landmark': Landmark,
  'piggy-bank': PiggyBank,
  'coins': Coins,
  'vault': Vault,
  'hand-coins': HandCoins,

  // New Categories
  'shirt': Shirt,
  'graduation-cap': GraduationCap,
  'baby': Baby,
  'gamepad': Gamepad2,
  'tv': Tv,
  'laptop': Laptop,
  'hammer': Hammer,
  'wrench': Wrench,
  'stethoscope': Stethoscope,
  'pill': Pill,
  'fuel': Fuel,
  'bike': Bike,
  'train': Train,
  'flower': Flower,
  'scissors': Scissors,
  'sofa': Sofa,
  'palette': Palette,
  'trophy': Trophy,
  'gem': Gem,
  'pizza': Pizza,
  'beer': Beer,
  
  // Utilities & Housing
  'bath': Bath, // Water
  'droplet': Droplet, // Water alternative
  'thermometer': Thermometer, // Heating
  'lightbulb': Lightbulb, // Electricity
  'flame': Flame, // Gas
  'sun': Sun, // Vacation/Summer
};

interface CategoryIconProps {
  iconName: string;
  size?: number;
  color?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconName, 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => {
  const IconComponent = ICON_MAP[iconName] || CircleHelp;
  
  return <IconComponent size={size} color={color} className={className} />;
};
