
export interface Wishlist {
    id: string;
    name: string;
    bookCount: number;
    privacy: 'public' | 'private' | 'shared';
    coverImages: string[];
    lastUpdated: string;
}

export const MOCK_WISHLISTS: Wishlist[] = [
    {
        id: '1',
        name: "Cumpleaños 2024 🎂",
        bookCount: 5,
        privacy: 'public',
        coverImages: [
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794"
        ],
        lastUpdated: "Hace 2 días"
    },
    {
        id: '2',
        name: "Lecturas de Verano ☀️",
        bookCount: 12,
        privacy: 'private',
        coverImages: [
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19",
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73"
        ],
        lastUpdated: "Hace 1 semana"
    },
    {
        id: '3',
        name: "Libros Técnicos 💻",
        bookCount: 3,
        privacy: 'shared',
        coverImages: [
            "https://images.unsplash.com/photo-1532012197267-da84d127e765"
        ],
        lastUpdated: "Hace 1 mes"
    }
];

export interface WishlistItem {
    id: string;
    wishlistId: string;
    title: string;
    author: string;
    coverUrl: string;
    price: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'AVAILABLE' | 'RESERVED' | 'PURCHASED';
    reservedBy?: string;
    crowdfunding?: {
        target: number;
        collected: number;
        contributors: number; // count of people
    };
    dedication?: {
        message: string;
        from: string;
        style: 'classic' | 'fun' | 'romantic';
    };
}

export const MOCK_ITEMS: WishlistItem[] = [
    {
        id: '101',
        wishlistId: '1',
        title: "The Midnight Library",
        author: "Matt Haig",
        coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
        price: 22.50,
        priority: 'HIGH',
        status: 'AVAILABLE'
    },
    {
        id: '104',
        wishlistId: '1',
        title: "Dune: Edición Coleccionista",
        author: "Frank Herbert",
        coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19",
        price: 85.00,
        priority: 'HIGH',
        status: 'AVAILABLE',
        crowdfunding: {
            target: 85.00,
            collected: 45.00,
            contributors: 3
        }
    },
    {
        id: '102',
        wishlistId: '1',
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e",
        price: 18.90,
        priority: 'MEDIUM',
        status: 'RESERVED',
        reservedBy: "Ana (Tu hermana)",
        dedication: {
            message: "¡Espero que te encante! Sé que llevas tiempo queriéndolo leer. ¡Feliz Cumpleaños! 🎉",
            from: "Ana",
            style: 'fun'
        }
    },
    {
        id: '103',
        wishlistId: '1',
        title: "Project Hail Mary",
        author: "Andy Weir",
        coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794",
        price: 24.00,
        priority: 'HIGH',
        status: 'PURCHASED',
        reservedBy: "Carlos"
    }
];

export interface GiftRecipient {
    id: string;
    name: string;
    relation: string; // e.g., "Sobrino", "Pareja"
    avatarUrl: string;
    upcomingEvent?: {
        name: string;
        date: string; // ISO or readable
        daysLeft: number;
    };
    notes: string;
    giftIdeasCount: number;
}

export const MOCK_RECIPIENTS: GiftRecipient[] = [
    {
        id: 'p1',
        name: "Clara",
        relation: "Pareja 💖",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        upcomingEvent: {
            name: "Aniversario",
            date: "14 Feb",
            daysLeft: 5
        },
        notes: "Le gusta la novela histórica y el realismo mágico.",
        giftIdeasCount: 4
    },
    {
        id: 'p2',
        name: "Lucas",
        relation: "Sobrino",
        avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
        upcomingEvent: {
            name: "Cumpleaños",
            date: "20 Mar",
            daysLeft: 42
        },
        notes: "Fan de Harry Potter y la fantasía juvenil.",
        giftIdeasCount: 2
    },
    {
        id: 'p3',
        name: "Mamá",
        relation: "Familia",
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956",
        notes: "Biografías y cocina.",
        giftIdeasCount: 0
    }
];
