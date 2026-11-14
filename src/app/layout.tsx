import type {Metadata} from 'next';
import {Header} from '@/components/Header';
import {SnapshotRefresh} from '@/components/SnapshotRefresh';
import './globals.css';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata:Metadata={title:{default:'CS ji est — Матч-центр CS2',template:'%s · CS ji est'},description:'Расписание, результаты и турниры профессионального Counter-Strike 2.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body><a href="#main" className="skip-link">К содержимому</a><Header/><SnapshotRefresh/><main id="main" className="container">{children}</main></body></html>}
