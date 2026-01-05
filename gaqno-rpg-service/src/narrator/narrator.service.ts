import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NarrateActionDto } from './dto/narrate-action.dto';

export interface NarratorResponse {
  outcome: 'critical_success' | 'success' | 'partial' | 'failure' | 'critical_failure';
  dice: {
    roll: number;
    formula: string;
    target?: number;
    natural: number;
  };
  narratives: Array<{
    level: string;
    text: string;
  }>;
  narrative_variants?: Array<{
    level: string;
    variants: string[];
  }>;
  mechanics: {
    hp_change?: number;
    xp_gain?: number;
    resources?: Record<string, number>;
    status_effects_added?: string[];
    status_effects_removed?: string[];
  };
  image_prompts?: Array<{
    id: string;
    prompt: string;
    style: string;
    aspect_ratio: string;
    negative_tags: string[];
  }>;
  ui_actions?: Array<{
    type: string;
    name: string;
    duration_ms: number;
    target?: string;
    priority: 'alta' | 'média' | 'baixa';
    message?: string;
  }>;
  updated_character_sheet?: {
    id: string;
    attributes?: Record<string, number>;
    resources?: Record<string, number>;
  };
  history_entry?: {
    summary: string;
    timestamp: string;
  };
  memory_updates?: Array<{
    key: string;
    value: string;
    replace: boolean;
  }>;
  gm_tips?: string[];
  next_scene_hooks?: string[];
}

@Injectable()
export class NarratorService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService
  ) {
    const envUrl = this.config.get<string>('AI_SERVICE_URL');
    if (envUrl) {
      this.aiServiceUrl = envUrl;
    } else {
      const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'production';
      this.aiServiceUrl = isDocker ? 'http://ai-service:4002' : 'http://localhost:4002';
    }
  }

  async narrateAction(dto: NarrateActionDto, sessionId: string): Promise<NarratorResponse> {
    const systemPrompt = `SISTEMA: Você é um Engenheiro de Software e Designer UX/UI full-stack experiente que atua como Assistente Narrador para uma SPA de sessão RPG com integração total de IA. Objetivo: transformar ações e resultados (dados) dos jogadores em narrativas de jogo, sugerir variações por nível de sucesso, gerar prompts de imagem, atualizar fichas e fornecer instruções UI/UX para animações e histórico. Responda em português (pt-BR) de forma cinematográfica, clara e compacta. Sempre retorne resposta estruturada em JSON (veja esquema abaixo). Priorize: coerência narrativa, conservação de contexto de sessão, e outputs prontos para consumo pela camada frontend (animações, imagens, fichas, resumo de memória).

INSTRUÇÕES ESPECÍFICAS:
- Para ações de COMBATE: Sempre inclua mechanics.hp_change se houver dano recebido ou causado. Descreva o impacto visual do combate.
- Para ações de DIÁLOGO: Inclua a resposta do NPC e o resultado da interação social. Atualize memória com informações importantes da conversa.
- Para ações de EXPLORAÇÃO: Descreva detalhadamente o ambiente, o que o jogador vê, ouve e sente. Inclua locationContext na resposta se a localização mudar.
- Para encontro de ITENS: Descreva o item encontrado, suas propriedades, aparência e como o jogador interage com ele. Inclua na memória.
- Sempre inclua locationContext na resposta quando relevante, especialmente para mudanças de localização. O locationContext deve ter: city (cidade), terrain (terreno), environment (ambiente), description (descrição).`;

    const userPrompt = this.buildUserPrompt(dto);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/v1/ai/generate`,
          {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            response_format: 'json',
            temperature: 0.8,
            max_tokens: 2000
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );

      const result = this.parseNarratorResponse(response.data);
      return result;
    } catch (error: any) {
      console.error('Error calling AI service:', error);
      return this.generateFallbackResponse(dto);
    }
  }

  private detectActionType(action: string): 'battle' | 'dialogue' | 'exploration' | 'item' | 'other' {
    const actionLower = action.toLowerCase();
    
    // Palavras-chave para batalha
    const battleKeywords = ['atacar', 'ataque', 'golpe', 'espada', 'arma', 'dano', 'combate', 'lutar', 'batalha', 'defender', 'esquivar', 'bloquear'];
    if (battleKeywords.some(keyword => actionLower.includes(keyword))) {
      return 'battle';
    }
    
    // Palavras-chave para diálogo
    const dialogueKeywords = ['falar', 'dizer', 'perguntar', 'conversar', 'dialogar', 'negociar', 'persuadir', 'intimidar', 'convencer'];
    if (dialogueKeywords.some(keyword => actionLower.includes(keyword))) {
      return 'dialogue';
    }
    
    // Palavras-chave para exploração
    const explorationKeywords = ['procurar', 'investigar', 'examinar', 'explorar', 'andar', 'caminhar', 'subir', 'descer', 'abrir', 'fechar', 'entrar', 'sair'];
    if (explorationKeywords.some(keyword => actionLower.includes(keyword))) {
      return 'exploration';
    }
    
    // Palavras-chave para itens
    const itemKeywords = ['pegar', 'pegar', 'coletar', 'usar', 'equipar', 'item', 'objeto', 'encontrar', 'encontrou', 'achou'];
    if (itemKeywords.some(keyword => actionLower.includes(keyword))) {
      return 'item';
    }
    
    return 'other';
  }

  private buildUserPrompt(dto: NarrateActionDto): string {
    const actionType = this.detectActionType(dto.action);
    const diceInfo = `Dado: ${dto.dice.formula}, Resultado: ${dto.dice.roll}, Natural: ${dto.dice.natural}${dto.dice.target ? `, Alvo: ${dto.dice.target}` : ''}`;
    
    // Construir contexto detalhado
    const contextParts: string[] = [];
    if (dto.context) {
      if (dto.context.location) {
        contextParts.push(`Localização: ${dto.context.location}`);
      }
      if (dto.context.npc) {
        contextParts.push(`NPC: ${dto.context.npc}`);
      }
      if (dto.context.target_dc) {
        contextParts.push(`DC Alvo: ${dto.context.target_dc}`);
      }
      // Adicionar informações de evento do mestre se presente
      if (dto.context.eventType) {
        contextParts.push(`Tipo de Evento: ${dto.context.eventType}`);
      }
      if (dto.context.masterEvent) {
        contextParts.push('Evento criado pelo Mestre');
      }
    }
    
    const contextInfo = contextParts.length > 0 ? `\nContexto: ${contextParts.join(', ')}` : '';
    
    // Informações do personagem
    const characterInfo = dto.character_sheet ? 
      `\nPersonagem: Atributos: ${JSON.stringify(dto.character_sheet.attributes || {})}, Recursos: ${JSON.stringify(dto.character_sheet.resources || {})}` : '';
    
    // Memória da sessão (formatada de forma mais legível)
    const memoryInfo = dto.session_memory && Object.keys(dto.session_memory).length > 0 ? 
      `\nMemória da Sessão: ${Object.entries(dto.session_memory).map(([key, value]) => `${key}: ${value}`).join('; ')}` : '';
    
    // Instruções específicas por tipo de ação
    const typeInstructions: Record<string, string> = {
      battle: 'Esta é uma ação de COMBATE. Inclua detalhes de dano, HP, e consequências do combate na narrativa. Se houver mudança de HP, inclua no campo mechanics.hp_change.',
      dialogue: 'Esta é uma ação de DIÁLOGO/CONVERSA. Inclua a resposta do NPC e o resultado da interação social.',
      exploration: 'Esta é uma ação de EXPLORAÇÃO. Descreva o que o jogador encontra, vê ou descobre no ambiente.',
      item: 'Esta é uma ação relacionada a ITENS. Descreva o item encontrado, suas propriedades e como o jogador interage com ele.',
      other: 'Esta é uma ação geral. Crie uma narrativa apropriada baseada no resultado do dado.'
    };
    
    const typeInstruction = typeInstructions[actionType] || typeInstructions.other;
    
    return `Tipo de Ação: ${actionType.toUpperCase()}
${typeInstruction}

Ação do Jogador: ${dto.action}
${diceInfo}${contextInfo}${characterInfo}${memoryInfo}

Gere uma resposta narrativa completa seguindo o esquema JSON especificado. Para ações de batalha, sempre inclua mechanics.hp_change se houver dano. Para encontro de itens, inclua detalhes do item na narrativa.`;
  }

  private parseNarratorResponse(data: any): NarratorResponse {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return this.generateFallbackResponse(null);
      }
    }

    if (data.content) {
      try {
        data = JSON.parse(data.content);
      } catch {
        return this.generateFallbackResponse(null);
      }
    }

    const response: NarratorResponse = {
      outcome: data.outcome || 'success',
      dice: data.dice || { roll: 0, formula: '1d20', natural: 0 },
      narratives: data.narratives || [],
      narrative_variants: data.narrative_variants,
      mechanics: data.mechanics || {},
      image_prompts: data.image_prompts,
      ui_actions: data.ui_actions,
      updated_character_sheet: data.updated_character_sheet,
      history_entry: data.history_entry,
      memory_updates: data.memory_updates,
      gm_tips: data.gm_tips,
      next_scene_hooks: data.next_scene_hooks
    };

    // Adicionar locationContext se presente na resposta
    if (data.locationContext) {
      (response as any).locationContext = data.locationContext;
    }

    // Adicionar context se presente na resposta
    if (data.context) {
      (response as any).context = data.context;
    }

    return response;
  }

  private generateFallbackResponse(dto: NarrateActionDto | null): NarratorResponse {
    const outcome = dto?.dice.roll === 20 ? 'critical_success' : dto?.dice.roll === 1 ? 'critical_failure' : 'success';
    
    const dice = dto?.dice ? {
      roll: typeof dto.dice.roll === 'number' ? dto.dice.roll : parseInt(String(dto.dice.roll)),
      formula: dto.dice.formula,
      natural: typeof dto.dice.natural === 'number' ? dto.dice.natural : parseInt(String(dto.dice.natural)),
      target: dto.dice.target ? (typeof dto.dice.target === 'number' ? dto.dice.target : parseInt(String(dto.dice.target))) : undefined
    } : { roll: 10, formula: '1d20', natural: 10 };
    
    return {
      outcome: outcome as any,
      dice,
      narratives: [
        { level: 'success', text: dto?.action || 'Ação executada com sucesso.' }
      ],
      mechanics: {},
      ui_actions: [
        { type: 'toast', name: 'action_result', duration_ms: 3000, priority: 'média', message: 'Ação processada' }
      ]
    };
  }

  async generateCampaignStep(
    step: 'concept' | 'world' | 'narrative' | 'npcs' | 'hooks',
    context: Record<string, any>,
    existingContent: Record<string, any>,
    seed?: string
  ): Promise<Record<string, any>> {
    const stepPrompts: Record<string, string> = {
      concept: `Gere um conceito de campanha RPG em JSON com: theme (tema: fantasy/sci-fi/horror/etc), tone (tom: épico/sombrio/heroico/etc), setting (ambientação breve). Seja criativo e específico.`,
      world: `Gere uma descrição de mundo em JSON com: name (nome do mundo), geography (geografia), magic/tech (sistema mágico ou tecnológico), history (história breve). Use o contexto fornecido.`,
      narrative: `Gere uma narrativa inicial em JSON com: opening (abertura da campanha, 2-3 parágrafos), inciting_incident (incidente que inicia a aventura), first_quest (primeira missão sugerida).`,
      npcs: `Gere uma lista de NPCs em JSON array, cada um com: name, role (papel: monarch/wizard/villain/etc), description (descrição breve), motivation (motivação). Mínimo 3 NPCs.`,
      hooks: `Gere uma lista de ganchos narrativos em JSON array (strings). Cada gancho deve ser uma frase que sugere uma cena ou evento futuro. Mínimo 5 ganchos.`
    };

    const systemPrompt = `Você é um assistente especializado em criação de campanhas RPG. Retorne APENAS JSON válido, sem markdown, sem explicações.`;
    const userPrompt = `${stepPrompts[step]}\n\nContexto existente: ${JSON.stringify(existingContent)}\nContexto adicional: ${JSON.stringify(context)}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/v1/ai/generate`,
          {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            response_format: 'json',
            temperature: 0.9,
            max_tokens: 1500
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );

      let result = response.data;
      if (typeof result === 'string') {
        result = JSON.parse(result);
      }
      if (result.content) {
        result = JSON.parse(result.content);
      }

      return result;
    } catch (error: any) {
      console.error('Error generating campaign step:', error);
      return this.generateFallbackCampaignStep(step);
    }
  }

  private generateFallbackCampaignStep(step: string): Record<string, any> {
    const fallbacks: Record<string, any> = {
      concept: { theme: 'fantasy', tone: 'épico', setting: 'Reino medieval' },
      world: { name: 'Mundo Desconhecido', geography: 'Diversa', magic: 'Presente' },
      narrative: { opening: 'A aventura começa...', inciting_incident: 'Algo acontece', first_quest: 'Primeira missão' },
      npcs: [{ name: 'NPC 1', role: 'guia', description: 'Um guia misterioso' }],
      hooks: ['Gancho 1', 'Gancho 2', 'Gancho 3']
    };
    return fallbacks[step] || {};
  }
}

