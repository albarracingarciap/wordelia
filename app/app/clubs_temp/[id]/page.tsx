import ClientPage from "./ClientPage";

export async function generateStaticParams() {
    return [{ id: 'mock-id' }];
}

export default function Page() {
    return <ClientPage />;
}
