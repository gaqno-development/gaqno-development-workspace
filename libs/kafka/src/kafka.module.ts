import { Module, Global } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { loadKafkaConfigFromEnv } from './kafka.config';

const config = loadKafkaConfigFromEnv();

@Global()
@Module({
  providers: [
    { provide: 'KAFKA_CONFIG', useValue: config },
    KafkaProducerService,
    KafkaConsumerService,
  ],
  exports: ['KAFKA_CONFIG', KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
