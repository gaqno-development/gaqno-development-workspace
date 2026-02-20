# Ajuste de Timezone dos Cron Jobs

## 📅 Data do ajuste: 2026-02-20 20:09 UTC

## 🔧 Problema identificado
Os cron jobs de health check estavam rodando no horário UTC (GMT+0), o que correspondia a horários inadequados para São Paulo (UTC-3).

## ✅ Solução aplicada
Todos os 12 cron jobs foram ajustados para considerar o fuso horário de São Paulo (UTC-3).

## 📊 Detalhes das mudanças

### 1. Health Checks (8 serviços)
**Antes**: Minutos 0-7 de cada hora UTC  
**Corresponde a**: 21h-21h07 em São Paulo (ou 22h-22h07 no horário de verão)

**Depois**: Minutos 3-10 de cada hora UTC  
**Corresponde a**: 0h-0h07 em São Paulo (meia-noite)

**Serviços ajustados**:
1. `portal.gaqno.com.br` → minuto 3 UTC (0h03 São Paulo)
2. `sso-service` → minuto 4 UTC (0h04 São Paulo)
3. `pdv-service` → minuto 5 UTC (0h05 São Paulo)
4. `ai-service` → minuto 6 UTC (0h06 São Paulo)
5. `finance-service` → minuto 7 UTC (0h07 São Paulo)
6. `rpg-service` → minuto 8 UTC (0h08 São Paulo)
7. `omnichannel-service` → minuto 9 UTC (0h09 São Paulo)
8. `wellness-service` → minuto 10 UTC (0h10 São Paulo)

### 2. Revisões de Documentação Semanal (4 tecnologias)
**Antes**: 8h UTC (5h São Paulo)  
**Depois**: 11h UTC (8h São Paulo)

**Tecnologias ajustadas**:
- **Segunda-feira**: Vite Docs → 11h UTC (8h São Paulo)
- **Terça-feira**: ReactJS Docs → 11h UTC (8h São Paulo)
- **Quarta-feira**: NestJS Docs → 11h UTC (8h São Paulo)
- **Quinta-feira**: TypeScript Docs → 11h UTC (8h São Paulo)

## 🎯 Benefícios do ajuste
1. **Horários mais adequados**: Health checks rodam à meia-noite (horário de menor tráfego)
2. **Documentação em horário comercial**: Revisões às 8h da manhã
3. **Melhor monitoramento**: Alertas chegam em horários mais convenientes
4. **Consistência**: Todos os jobs seguem o mesmo fuso horário

## 📝 Próximos passos
1. Monitorar os próximos ciclos de execução
2. Verificar se os alertas estão chegando nos horários corretos
3. Ajustar outros cron jobs futuros para o mesmo padrão

## 🔍 Verificação
Para verificar os próximos horários de execução:
```bash
openclaw cron list
```

Os horários mostrados são em UTC. Para converter para São Paulo, subtraia 3 horas.

---
*Ajuste realizado automaticamente pelo OpenClaw em resposta à solicitação do usuário*