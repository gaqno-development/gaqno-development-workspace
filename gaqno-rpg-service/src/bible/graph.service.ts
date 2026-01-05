import { Injectable } from '@nestjs/common';
import { BibleService } from './bible.service';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  connections: string[];
}

interface GraphAnalysis {
  nodes: GraphNode[];
  isolatedNodes: string[];
  highlyConnectedNodes: string[];
  potentialHooks: string[];
}

@Injectable()
export class GraphService {
  constructor(private readonly bibleService: BibleService) {}

  async analyzeCampaignGraph(campaignId: string): Promise<GraphAnalysis> {
    const entities = await this.bibleService.getEntitiesByCampaign(campaignId);
    const nodes: GraphNode[] = [];
    const connectionCounts: Record<string, number> = {};

    for (const entity of entities) {
      const links = await this.bibleService.getEntityLinks(entity.id);
      const allConnections = [
        ...links.outgoing.map((l) => l.toEntityId),
        ...links.incoming.map((l) => l.fromEntityId),
      ];

      nodes.push({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        connections: allConnections,
      });

      connectionCounts[entity.id] = allConnections.length;
    }

    const isolatedNodes = nodes
      .filter((node) => node.connections.length === 0)
      .map((node) => node.id);

    const highlyConnectedNodes = Object.entries(connectionCounts)
      .filter(([_, count]) => count >= 3)
      .map(([id]) => id);

    const potentialHooks = isolatedNodes
      .map((id) => {
        const node = nodes.find((n) => n.id === id);
        return node ? `${node.name} (${node.type}) está isolado e pode ser conectado` : null;
      })
      .filter((hook): hook is string => hook !== null);

    return {
      nodes,
      isolatedNodes,
      highlyConnectedNodes,
      potentialHooks,
    };
  }

  async suggestConnections(campaignId: string): Promise<Array<{ from: string; to: string; reason: string }>> {
    const analysis = await this.analyzeCampaignGraph(campaignId);
    const suggestions: Array<{ from: string; to: string; reason: string }> = [];

    for (const isolatedId of analysis.isolatedNodes) {
      const isolatedNode = analysis.nodes.find((n) => n.id === isolatedId);
      if (!isolatedNode) continue;

      const potentialConnections = analysis.nodes.filter(
        (node) => node.id !== isolatedId && node.type !== isolatedNode.type
      );

      for (const target of potentialConnections.slice(0, 2)) {
        suggestions.push({
          from: isolatedId,
          to: target.id,
          reason: `${isolatedNode.name} pode estar relacionado com ${target.name}`,
        });
      }
    }

    return suggestions;
  }
}

