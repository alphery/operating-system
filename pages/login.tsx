import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/');
    }, [router]);
    return <div className="min-h-screen bg-[#050505]" />;
}
