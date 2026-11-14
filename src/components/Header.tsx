import Link from 'next/link';
import Image from 'next/image';
import {Navigation} from './Navigation';
export function Header(){return <header className="header"><div className="header-inner"><Link href="/" className="brand" aria-label="CS ji est — главная"><Image src="/goose-logo.png" alt="" width={38} height={38} sizes="(max-width: 480px) 30px, 38px" className="brand-logo" priority/><span className="brand-name">CS ji est</span></Link><Navigation/></div></header>}
