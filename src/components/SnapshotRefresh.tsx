'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export function SnapshotRefresh(){const router=useRouter();useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')router.refresh();};const timer=setInterval(refresh,5*60*1000);document.addEventListener('visibilitychange',refresh);return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[router]);return null;}
