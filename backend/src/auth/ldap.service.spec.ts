import { Client } from 'ldapts';
import { LdapService } from './ldap.service';

jest.mock('ldapts', () => ({
  Client: jest.fn(),
}));

describe('LdapService', () => {
  let service: LdapService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LdapService();
  });

  it('binds to the domain account and succeeds when LDAP credentials are valid', async () => {
    const bindMock = jest.fn().mockResolvedValue(undefined);
    const unbindMock = jest.fn().mockResolvedValue(undefined);

    (Client as unknown as jest.Mock).mockImplementation(() => ({
      bind: bindMock,
      unbind: unbindMock,
    }));

    const result = await service.validateUser('at01093', 'admin');

    expect(bindMock).toHaveBeenCalledWith('CORP\\at01093', 'admin');
    expect(unbindMock).toHaveBeenCalled();
    expect(result).toMatchObject({ username: 'at01093', role: 'admin' });
  });
});
