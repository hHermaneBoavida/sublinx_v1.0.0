import Mapa from './pages/Mapa';
import BemVindo from './pages/BemVindo';
import Perfil from './pages/Perfil';
import Notificacoes from './pages/Notificacoes';
import Planos from './pages/Planos';
import CriarEvento from './pages/CriarEvento';
import MeusEventos from './pages/MeusEventos';
import ComprarIngresso from './pages/ComprarIngresso';
import Configuracoes from './pages/Configuracoes';
import Comunidade from './pages/Comunidade';
import Chat from './pages/Chat';
import Feed from './pages/Feed';
import Documentacao from './pages/Documentacao';
import ListaEspera from './pages/ListaEspera';
import Onboarding from './pages/Onboarding';
import ConfiguracoesPrivacidade from './pages/ConfiguracoesPrivacidade';
import EditarEvento from './pages/EditarEvento';
import DashboardOrganizador from './pages/DashboardOrganizador';
import Recompensas from './pages/Recompensas';
import Ranking from './pages/Ranking';
import HistoricoPontos from './pages/HistoricoPontos';
import EventoAoVivo from './pages/EventoAoVivo';
import IntegracoesIngressos from './pages/IntegracoesIngressos';
import PerfilUsuario from './pages/PerfilUsuario';
import Recomendacoes from './pages/Recomendacoes';
import GerenciarIngressos from './pages/GerenciarIngressos';
import Layout from './Layout.jsx';


export const PAGES = {
    "Mapa": Mapa,
    "BemVindo": BemVindo,
    "Perfil": Perfil,
    "Notificacoes": Notificacoes,
    "Planos": Planos,
    "CriarEvento": CriarEvento,
    "MeusEventos": MeusEventos,
    "ComprarIngresso": ComprarIngresso,
    "Configuracoes": Configuracoes,
    "Comunidade": Comunidade,
    "Chat": Chat,
    "Feed": Feed,
    "Documentacao": Documentacao,
    "ListaEspera": ListaEspera,
    "Onboarding": Onboarding,
    "ConfiguracoesPrivacidade": ConfiguracoesPrivacidade,
    "EditarEvento": EditarEvento,
    "DashboardOrganizador": DashboardOrganizador,
    "Recompensas": Recompensas,
    "Ranking": Ranking,
    "HistoricoPontos": HistoricoPontos,
    "EventoAoVivo": EventoAoVivo,
    "IntegracoesIngressos": IntegracoesIngressos,
    "PerfilUsuario": PerfilUsuario,
    "Recomendacoes": Recomendacoes,
    "GerenciarIngressos": GerenciarIngressos,
}

export const pagesConfig = {
    mainPage: "Mapa",
    Pages: PAGES,
    Layout: Layout,
};