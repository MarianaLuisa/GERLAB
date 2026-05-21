import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

function parseCsv(s: string | null | undefined) {
  return String(s ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function parseBool(v: unknown, fallback: boolean) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return fallback;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const email = String(req.headers['x-user-email'] ?? '')
      .toLowerCase()
      .trim();

    const ip =
      (req.headers['x-forwarded-for'] as string) ??
      req.socket?.remoteAddress ??
      null;
    const userAgent = String(req.headers['user-agent'] ?? '');

    const logAccessDenied = async () => {
      try {
        await this.prisma.accessLog.create({
          data: {
            actorEmail: email || null,
            event: 'ACCESS_DENIED',
            ip: ip ? String(ip) : null,
            userAgent: userAgent || null,
          },
        });
      } catch {
        // não derruba por falha de log
      }
    };

    const deny = async (msg: string) => {
      await logAccessDenied();
      throw new UnauthorizedException(msg);
    };

    // 0) email precisa existir
    if (!email) {
      await deny('Faça login com seu e-mail institucional.');
    }

    // 1) configurações de segurança (ENV pode sobrescrever DB)
    const envAllowed = parseCsv(this.config.get('ALLOWED_EMAILS'));
    const envRequireInstitutional = this.config.get(
      'REQUIRE_INSTITUTIONAL_DOMAIN',
    );

    let dbAllowed: string[] = [];
    let dbRequireInstitutional = true;
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { id: 'singleton' },
        select: {
          allowedManagerEmails: true,
          requireInstitutionalDomain: true,
        },
      });
      dbAllowed = parseCsv(settings?.allowedManagerEmails);
      dbRequireInstitutional = settings?.requireInstitutionalDomain ?? true;
    } catch {
      // ignore
    }

    const requireInstitutional = parseBool(
      envRequireInstitutional,
      dbRequireInstitutional,
    );

    if (requireInstitutional && !email.endsWith('@ufcspa.edu.br')) {
      await deny('Acesso restrito a e-mail institucional (@ufcspa.edu.br).');
    }

    const list = envAllowed.length ? envAllowed : dbAllowed;

    // 2) lista fechada (opcional): se existir lista, exige estar nela
    if (list.length > 0 && !list.includes(email)) {
      await deny('Seu e-mail não está autorizado para acessar o sistema.');
    }

    req.userEmail = email;

    // 3) log acesso autorizado (vai registrar por requisição)
    try {
      await this.prisma.accessLog.create({
        data: {
          actorEmail: email,
          event: 'LOGIN',
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
