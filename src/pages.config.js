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