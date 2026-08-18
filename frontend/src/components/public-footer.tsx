import Link from "next/link";
import { BeeIcon } from "@/components/icons";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#23252d] bg-[#121316] py-12 text-xs text-[#8b8e9b]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <BeeIcon className="h-4 w-4 text-[#d48b38]" />
              <span className="font-semibold text-[#f4f4f6]">BetterBee</span>
            </div>
            <p className="text-[11px] text-[#6c6f80] leading-relaxed">
              Production document intelligence and verifiable retrieval for modern teams.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-medium text-[#f4f4f6] text-[11px] uppercase tracking-wider">Product</span>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/how-it-works#pipeline" className="hover:text-[#eaebee] transition-colors">How It Works</Link></li>
              <li><Link href="/how-it-works#use-cases" className="hover:text-[#eaebee] transition-colors">Use Cases</Link></li>
              <li><Link href="/how-it-works#formats" className="hover:text-[#eaebee] transition-colors">Supported Formats</Link></li>
              <li><Link href="/how-it-works#security" className="hover:text-[#eaebee] transition-colors">Security Architecture</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-medium text-[#f4f4f6] text-[11px] uppercase tracking-wider">Application</span>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/workspaces" className="hover:text-[#eaebee] transition-colors">Workspaces Dashboard</Link></li>
              <li><Link href="/status" className="hover:text-[#eaebee] transition-colors">System Status</Link></li>
              <li><Link href="/sign-in" className="hover:text-[#eaebee] transition-colors">Sign In</Link></li>
              <li><Link href="/sign-up" className="hover:text-[#eaebee] transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-medium text-[#f4f4f6] text-[11px] uppercase tracking-wider">Platform Stack</span>
            <ul className="space-y-1.5 text-[11px] text-[#6c6f80]">
              <li>FastAPI + ChromaDB</li>
              <li>Groq Llama 3 Inference</li>
              <li>SentenceTransformers</li>
              <li>AWS S3 Private Storage</li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-medium text-[#f4f4f6] text-[11px] uppercase tracking-wider text-[#d48b38]">Developer</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a href="https://yuviii.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#eaebee] text-[#d48b38] font-medium transition-colors flex items-center gap-1">
                  <span>Portfolio (yuviii.in)</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a href="https://github.com/uv3704" target="_blank" rel="noopener noreferrer" className="hover:text-[#eaebee] transition-colors flex items-center gap-1">
                  <span>GitHub (@uv3704)</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/uv3704/" target="_blank" rel="noopener noreferrer" className="hover:text-[#eaebee] transition-colors flex items-center gap-1">
                  <span>LinkedIn</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a href="mailto:uv3704@gmail.com" className="hover:text-[#eaebee] transition-colors">
                  uv3704@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#23252d] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6c6f80]">
          <div>
            Built by <a href="https://yuviii.in" target="_blank" rel="noopener noreferrer" className="text-[#b0b3c1] hover:text-[#eaebee] font-medium">Yuvraj Singh Rathore</a> &middot; &copy; {new Date().getFullYear()} BetterBee.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://yuviii.in" target="_blank" rel="noopener noreferrer" className="text-[#d48b38] hover:text-[#e5a04e] transition-colors">Other Projects ↗</a>
            <Link href="/security" className="hover:text-[#eaebee] transition-colors">Privacy & Governance</Link>
            <Link href="/how-it-works" className="hover:text-[#eaebee] transition-colors">Architecture Specs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
