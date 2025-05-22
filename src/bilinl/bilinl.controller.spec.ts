import { Test, TestingModule } from '@nestjs/testing';
import { BilinlController } from './bilinl.controller';

describe('BilinlController', () => {
  let controller: BilinlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BilinlController],
    }).compile();

    controller = module.get<BilinlController>(BilinlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
