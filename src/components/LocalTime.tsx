'use client';
import { useEffect, useState } from 'react';
export function LocalTime({value,date=false}:{value:string;date?:boolean}){const [label,setLabel]=useState('—');useEffect(()=>{setLabel(new Intl.DateTimeFormat('ru-RU',date?{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}:{hour:'2-digit',minute:'2-digit'}).format(new Date(value)))},[value,date]);return <time dateTime={value} suppressHydrationWarning>{label}</time>}
