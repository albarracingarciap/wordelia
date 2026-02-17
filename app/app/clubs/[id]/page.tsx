import ClientPage from "./ClientPage";

export async function generateStaticParams() {
    return [
        { id: 'mock-id' },
        { id: 'c1' },
        { id: 'c2' },
        { id: 'c3' },
        { id: 'c4' },
        { id: 'c5' }
    ];
}

export default function Page() {
    return <ClientPage />;
}
