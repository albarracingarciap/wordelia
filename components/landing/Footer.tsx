import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";
import { Instagram, Linkedin, Twitter, Facebook, Send } from "lucide-react";

export function Footer() {
    return (
        <footer id="footer" className="relative mt-0 bg-[#FFFAEF] text-grey pt-8 pb-8">
            <div className="max-w-[1200px] mx-auto px-6 md:px-8">

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
                    {/* Column 1: Brand & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative h-12 w-48">
                                <Image
                                    src="/assets/images/logo_wordelia.png"
                                    alt="Wordelia Logo"
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                        </Link>
                        <p className="text-sm text-grey/80 leading-relaxed text-balance">
                            Wordelia es el hogar de quienes buscan profundidad en cada página. Nuestra misión es potenciar la conexión humana a través de la literatura con herramientas inteligentes que transforman la lectura en una experiencia compartida inolvidable.
                        </p>
                        <div className="flex items-center gap-4 text-teal">
                            <a href="#" className="hover:text-coral transition-colors" aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-coral transition-colors" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-coral transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-coral transition-colors" aria-label="Facebook">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-coral transition-colors" aria-label="Telegram">
                                <Send className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Explorar */}
                    <div>
                        <h4 className="font-bold text-teal text-xs uppercase tracking-wider mb-6">EXPLORAR</h4>
                        <ul className="space-y-4 text-sm text-grey">
                            {['Clubes de lectura', 'Libros', 'Autores', 'Educación', 'Premium'].map(item => (
                                <li key={item}><Link href="#" className="hover:text-coral transition-colors">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Empresa */}
                    <div>
                        <h4 className="font-bold text-teal text-xs uppercase tracking-wider mb-6">EMPRESA</h4>
                        <ul className="space-y-4 text-sm text-grey">
                            {['Business', 'Librerías', 'Guías de uso', 'Planes', 'Sobre nosotros', 'Contacto'].map(item => (
                                <li key={item}><Link href="#" className="hover:text-coral transition-colors">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="font-bold text-teal text-xs uppercase tracking-wider mb-6">LEGAL</h4>
                        <ul className="space-y-4 text-sm text-grey">
                            {['Privacidad', 'Términos y Condiciones', 'Cookies'].map(item => (
                                <li key={item}><Link href="#" className="hover:text-coral transition-colors">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 5: Newsletter */}
                    <div className="lg:col-span-1">
                        <h4 className="font-bold text-teal text-xs uppercase tracking-wider mb-6">NEWSLETTER</h4>
                        <p className="text-sm text-grey mb-4">
                            Recibe inspiración literaria cada semana.
                        </p>
                        <form className="space-y-3">
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-2.5 rounded-lg border border-teal/10 bg-white text-sm focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/30 transition-all placeholder:text-grey/40"
                            />
                            <Button className="w-full justify-center bg-[#D56962] hover:bg-[#C25852] text-white shadow-none font-medium">
                                Suscribirme
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-grey/60 pt-8 border-t border-teal/10">
                    <p>© 2025 Wordelia. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-1">
                        Hecho con <span className="text-coral">❤</span> por lectores para lectores.
                    </p>
                </div>

            </div>
        </footer>
    );
}
