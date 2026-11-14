'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Trophy, Swords } from 'lucide-react';
export function Navigation(){ const pathname=usePathname();return <nav aria-label="Основная навигация">{[{href:'/',label:'Расписание',Icon:CalendarDays},{href:'/results',label:'Результаты',Icon:Swords},{href:'/tournaments',label:'Турниры',Icon:Trophy}].map(({href,label,Icon})=><Link className={pathname===href?'nav-link active':'nav-link'} key={href} href={href}><Icon size={17}/>{label}</Link>)}</nav> }
