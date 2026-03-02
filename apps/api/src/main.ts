import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { OutboxWorker } from "./notifications/outbox.worker";

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
  origin: "http://localhost:5173",
  allowedHeaders: ["Content-Type", "x-user-email"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"], // <-- ADD PUT
});

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, "0.0.0.0");

  console.log(`API rodando em http://localhost:${port}`);
}

bootstrap().catch((e) => {
  console.error("Falha ao iniciar API:", e);
  process.exit(1);
});