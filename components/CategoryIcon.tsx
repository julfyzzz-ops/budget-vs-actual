
import React from 'react';
import { 
  ShoppingCart, Bus, Home, Film, Heart, Briefcase, Gift, 
  MoreHorizontal, Utensils, Car, Zap, Wifi, Smartphone, 
  Coffee, Book, Music, Dumbbell, Plane, PawPrint, CircleHelp,
  ArrowRightLeft
} from 'lucide-react';

export const ICON_MAP: { [key: string]: React.ElementType } = {
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
  'transfer': ArrowRightLeft
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
