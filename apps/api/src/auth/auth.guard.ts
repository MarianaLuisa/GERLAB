import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

function parseCsv(s: string | null | undefined) {
  return String(s ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private config: ConfigService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const email = String(req.headers["x-user-email"] ?? "").toLowerCase().trim();

    const ip =
      (req.headers["x-forwarded-for"] as string) ??
      req.socket?.remoteAddress ??
      null;
    const userAgent = String(req.headers["user-agent"] ?? "");

    const deny = async (msg: string) => {
      try {
        await this.prisma.accessLog.create({
          data: {
            actorEmail: email || null,
            event: "ACCESS_DENIED",
            ip: ip ? String(ip) : null,
            userAgent: userAgent || null,
          },
        });
      } catch {
        // não bloqueia a requisição por falha de log
      }
      throw new UnauthorizedException(msg);
    };

    if (!email.endsWith("@ufcspa.edu.br")) {
      await deny("Acesso restrito a e-mail institucional.");
    }

    // 1) env ALLOWED_EMAILS
    const envAllowed = parseCsv(this.config.get("ALLOWED_EMAILS"));

    // 2) db SystemSettings.allowedManagerEmails (fallback)
    let dbAllowed: string[] = [];
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { id: "singleton" },
      });
      dbAllowed = parseCsv(settings?.allowedManagerEmails);
    } catch {
      // ignore
    }

    const allowed = new Set([...envAllowed, ...dbAllowed]);

    if (!allowed.has(email)) {
      await deny("E-mail não autorizado.");
    }

    req.userEmail = email;

    // log: login (interpretação: acesso autorizado)
    try {
      await this.prisma.accessLog.create({
        data: {
          actorEmail: email,
          event: "LOGIN",
          ip: ip ? String(ip) : null,
          userAgent: userAgent || null,
        },
      });
    } catch {
      // ignore
    }

    return true;
  }
}