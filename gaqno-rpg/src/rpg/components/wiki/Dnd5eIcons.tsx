import React from 'react';
import {
  Flame,
  Zap,
  Droplet,
  Wind,
  Snowflake,
  Sun,
  Moon,
  Sparkles,
  Book,
  Shield,
  Sword,
  Users,
  ScrollText,
  Hand,
  Package,
  Coins,
  Scale,
  Target,
  Clock,
  Gauge,
  Award,
  Gem,
  Scroll,
  Wand2,
  ShieldCheck,
  Skull,
  Heart,
  Activity,
  Brain,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

// Damage Type Icons
export const DamageTypeIcon: React.FC<{ type: string } & IconProps> = ({ type, className, size = 16 }) => {
  const typeLower = type.toLowerCase();
  const iconClass = className || 'w-4 h-4';
  
  if (typeLower.includes('fire')) return <Flame className={iconClass} size={size} />;
  if (typeLower.includes('lightning') || typeLower.includes('thunder')) return <Zap className={iconClass} size={size} />;
  if (typeLower.includes('acid') || typeLower.includes('poison')) return <Droplet className={iconClass} size={size} />;
  if (typeLower.includes('cold')) return <Snowflake className={iconClass} size={size} />;
  if (typeLower.includes('radiant')) return <Sun className={iconClass} size={size} />;
  if (typeLower.includes('necrotic')) return <Moon className={iconClass} size={size} />;
  if (typeLower.includes('force')) return <Wind className={iconClass} size={size} />;
  if (typeLower.includes('psychic')) return <Brain className={iconClass} size={size} />;
  
  return <Target className={iconClass} size={size} />;
};

// School Icons
export const SchoolIcon: React.FC<{ school: string } & IconProps> = ({ school, className, size = 16 }) => {
  const schoolLower = school.toLowerCase();
  const iconClass = className || 'w-4 h-4';
  
  if (schoolLower.includes('evocation')) return <Sparkles className={iconClass} size={size} />;
  if (schoolLower.includes('abjuration')) return <Shield className={iconClass} size={size} />;
  if (schoolLower.includes('conjuration')) return <Wand2 className={iconClass} size={size} />;
  if (schoolLower.includes('divination')) return <Book className={iconClass} size={size} />;
  if (schoolLower.includes('enchantment')) return <Sparkles className={iconClass} size={size} />;
  if (schoolLower.includes('illusion')) return <Moon className={iconClass} size={size} />;
  if (schoolLower.includes('necromancy')) return <Skull className={iconClass} size={size} />;
  if (schoolLower.includes('transmutation')) return <Activity className={iconClass} size={size} />;
  
  return <Book className={iconClass} size={size} />;
};

// Component Icons
export const ComponentIcon: React.FC<{ component: string } & IconProps> = ({ component, className, size = 16 }) => {
  const comp = component.toUpperCase();
  const iconClass = className || 'w-4 h-4';
  
  if (comp === 'V') return <ScrollText className={iconClass} size={size} />;
  if (comp === 'S') return <Hand className={iconClass} size={size} />;
  if (comp === 'M') return <Package className={iconClass} size={size} />;
  
  return <ScrollText className={iconClass} size={size} />;
};

// Category Icons
export const CategoryIcon: React.FC<{ category: string } & IconProps> = ({ category, className, size = 16 }) => {
  const catLower = category.toLowerCase();
  const iconClass = className || 'w-4 h-4';
  
  if (catLower.includes('spell')) return <Sparkles className={iconClass} size={size} />;
  if (catLower.includes('equipment') || catLower.includes('weapon') || catLower.includes('armor')) return <Sword className={iconClass} size={size} />;
  if (catLower.includes('class')) return <Users className={iconClass} size={size} />;
  if (catLower.includes('monster') || catLower.includes('creature')) return <Skull className={iconClass} size={size} />;
  if (catLower.includes('race')) return <Users className={iconClass} size={size} />;
  if (catLower.includes('magic-item')) return <Gem className={iconClass} size={size} />;
  if (catLower.includes('rule')) return <Scroll className={iconClass} size={size} />;
  if (catLower.includes('damage-type')) return <Target className={iconClass} size={size} />;
  if (catLower.includes('school')) return <Book className={iconClass} size={size} />;
  
  return <ScrollText className={iconClass} size={size} />;
};

// Generic Icons
export const PropertyIcon: React.FC<{ property: string } & IconProps> = ({ property, className, size = 16 }) => {
  const propLower = property.toLowerCase();
  const iconClass = className || 'w-4 h-4';
  
  if (propLower.includes('level')) return <Award className={iconClass} size={size} />;
  if (propLower.includes('cost') || propLower.includes('price')) return <Coins className={iconClass} size={size} />;
  if (propLower.includes('weight')) return <Scale className={iconClass} size={size} />;
  if (propLower.includes('range') || propLower.includes('distance')) return <Target className={iconClass} size={size} />;
  if (propLower.includes('duration')) return <Clock className={iconClass} size={size} />;
  if (propLower.includes('casting') || propLower.includes('time')) return <Clock className={iconClass} size={size} />;
  if (propLower.includes('damage')) return <Sword className={iconClass} size={size} />;
  if (propLower.includes('hit') || propLower.includes('hp')) return <Heart className={iconClass} size={size} />;
  if (propLower.includes('armor') || propLower.includes('ac')) return <ShieldCheck className={iconClass} size={size} />;
  
  return <ScrollText className={iconClass} size={size} />;
};

