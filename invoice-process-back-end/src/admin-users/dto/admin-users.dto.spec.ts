import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePersonaDto } from './admin-users.dto';

describe('CreatePersonaDto', () => {
  it('rechaza identificación con letras', async () => {
    const dto = plainToInstance(CreatePersonaDto, { identification: 'AB12', firstName: 'A', lastName: 'B', email: 'a@b.com' });
    const errs = await validate(dto);
    expect(errs.some(e => e.property === 'identification')).toBe(true);
  });

  it('acepta identificación numérica', async () => {
    const dto = plainToInstance(CreatePersonaDto, { identification: '1712345678', firstName: 'A', lastName: 'B', email: 'a@b.com' });
    expect(await validate(dto)).toHaveLength(0);
  });
});
