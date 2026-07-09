import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { Role } from './schemas/role.schema';
import { ROLE_PERMISSIONS } from '../common/rbac/role-permissions';

describe('RolesService.seedDefaultRoles', () => {
  let service: RolesService; let model: any;
  beforeEach(async () => {
    model = { updateOne: jest.fn().mockResolvedValue({}) };
    const ref = await Test.createTestingModule({
      providers: [RolesService, { provide: getModelToken(Role.name), useValue: model }],
    }).compile();
    service = ref.get(RolesService);
  });
  it('setea permissions del rol admin con todas sus páginas', async () => {
    await service.seedDefaultRoles();
    const adminCall = model.updateOne.mock.calls.find((c: any) => c[0].name === 'admin');
    expect(adminCall).toBeDefined();
    expect(adminCall[1].$setOnInsert.permissions).toEqual(ROLE_PERMISSIONS.admin);
  });
});
