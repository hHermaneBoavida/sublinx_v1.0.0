/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AnalyticsOrganizador from './pages/AnalyticsOrganizador';
import BemVindo from './pages/BemVindo';
import Chat from './pages/Chat';
import ChatOrganizadores from './pages/ChatOrganizadores';
import ComprarIngresso from './pages/ComprarIngresso';
import Comunidade from './pages/Comunidade';
import ComunidadeDetalhes from './pages/ComunidadeDetalhes';
import Configuracoes from './pages/Configuracoes';
import ConfiguracoesPrivacidade from './pages/ConfiguracoesPrivacidade';
import CriarEvento from './pages/CriarEvento';
import DashboardOrganizador from './pages/DashboardOrganizador';
import Documentacao from './pages/Documentacao';
import EditarEvento from './pages/EditarEvento';
import EventoAoVivo from './pages/EventoAoVivo';
import Feed from './pages/Feed';
import GerenciarIngressos from './pages/GerenciarIngressos';
import GerenciarPatrocinadores from './pages/GerenciarPatrocinadores';
import HistoricoPontos from './pages/HistoricoPontos';
import Home from './pages/Home';
import IntegracoesIngressos from './pages/IntegracoesIngressos';
import ListaEspera from './pages/ListaEspera';
import Mapa from './pages/Mapa';
import MeusEventos from './pages/MeusEventos';
import Notificacoes from './pages/Notificacoes';
import Onboarding from './pages/Onboarding';
import Perfil from './pages/Perfil';
import PerfilUsuario from './pages/PerfilUsuario';
import Planos from './pages/Planos';
import Ranking from './pages/Ranking';
import Recomendacoes from './pages/Recomendacoes';
import Recompensas from './pages/Recompensas';
import ValidarIngresso from './pages/ValidarIngresso';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AnalyticsOrganizador": AnalyticsOrganizador,
    "BemVindo": BemVindo,
    "Chat": Chat,
    "ChatOrganizadores": ChatOrganizadores,
    "ComprarIngresso": ComprarIngresso,
    "Comunidade": Comunidade,
    "ComunidadeDetalhes": ComunidadeDetalhes,
    "Configuracoes": Configuracoes,
    "ConfiguracoesPrivacidade": ConfiguracoesPrivacidade,
    "CriarEvento": CriarEvento,
    "DashboardOrganizador": DashboardOrganizador,
    "Documentacao": Documentacao,
    "EditarEvento": EditarEvento,
    "EventoAoVivo": EventoAoVivo,
    "Feed": Feed,
    "GerenciarIngressos": GerenciarIngressos,
    "GerenciarPatrocinadores": GerenciarPatrocinadores,
    "HistoricoPontos": HistoricoPontos,
    "Home": Home,
    "IntegracoesIngressos": IntegracoesIngressos,
    "ListaEspera": ListaEspera,
    "Mapa": Mapa,
    "MeusEventos": MeusEventos,
    "Notificacoes": Notificacoes,
    "Onboarding": Onboarding,
    "Perfil": Perfil,
    "PerfilUsuario": PerfilUsuario,
    "Planos": Planos,
    "Ranking": Ranking,
    "Recomendacoes": Recomendacoes,
    "Recompensas": Recompensas,
    "ValidarIngresso": ValidarIngresso,
}

export const pagesConfig = {
    mainPage: "Mapa",
    Pages: PAGES,
    Layout: __Layout,
};