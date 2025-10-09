import axios from './axios';
import type {
  MetaProvider,
  MetaProviderList,
  StartCategoryOAuth,
  UpdateCategoryPermissions,
  AppleAuth,
  OAuthResponse,
  MetaProviderUpdate,
  CategoryType,
} from '@/types/meta-provider';

export const metaProvidersApi = {
  // Liste tous les MetaProviders de l'utilisateur
  async getAll(params?: { category?: CategoryType; active?: boolean }): Promise<{results: MetaProviderList[]}> {
    const { data } = await axios.get('/meta-providers/', { params });
    return data;
  },

  // Récupère un MetaProvider par ID avec ses providers
  async getById(id: number): Promise<MetaProvider> {
    const { data } = await axios.get(`/meta-providers/${id}/`);
    return data;
  },

  // Démarre le flux OAuth pour une catégorie
  async startOAuth(payload: StartCategoryOAuth): Promise<OAuthResponse> {
    const { data } = await axios.post('/meta-providers/start_oauth/', payload);
    return data;
  },

  // Authentification Apple (app-specific password)
  async appleAuth(payload: AppleAuth): Promise<MetaProvider> {
    const { data } = await axios.post('/meta-providers/apple/auth/', payload);
    return data;
  },

  // Met à jour un MetaProvider (nom, is_active)
  async update(id: number, payload: MetaProviderUpdate): Promise<MetaProvider> {
    const { data } = await axios.patch(`/meta-providers/${id}/`, payload);
    return data;
  },

  // Modifie les permissions d'un MetaProvider existant
  async updatePermissions(id: number, payload: UpdateCategoryPermissions): Promise<OAuthResponse> {
    const { data } = await axios.post(`/meta-providers/${id}/update-permissions/`, payload);
    return data;
  },

  // Supprime un MetaProvider (cascade vers ses Providers)
  async delete(id: number): Promise<void> {
    await axios.delete(`/meta-providers/${id}/`);
  },

  // Toggle actif/inactif
  async toggleActive(id: number): Promise<MetaProvider> {
    const metaProvider = await this.getById(id);
    return this.update(id, { is_active: !metaProvider.is_active });
  },
};
