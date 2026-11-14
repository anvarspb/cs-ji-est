'use client';
import {useEffect,useState} from 'react';
export function useLocalClock(){const [now,setNow]=useState<number|null>(null);useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return ()=>clearInterval(timer)},[]);return now;}
