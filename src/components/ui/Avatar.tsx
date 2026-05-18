import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-12 h-12 text-[15px]',
  xl: 'w-16 h-16 text-[18px]',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-indigo-500 to-blue-600', 
      'from-emerald-500 to-teal-600', 
      'from-rose-500 to-pink-600', 
      'from-amber-500 to-orange-600', 
      'from-sky-500 to-indigo-600', 
      'from-purple-500 to-violet-600'
    ];
    let hash = 0;
    const str = name || 'User';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full shrink-0',
        'font-black text-white select-none overflow-hidden border-2 border-white/5',
        !src && `bg-gradient-to-br ${getAvatarColor(name || '')}`,
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="uppercase tracking-tighter">{name ? getInitials(name).slice(0, 2) : '?'}</span>
      )}
    </div>
  )
}
