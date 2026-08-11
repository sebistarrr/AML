#!/usr/bin/env python3
"""Génère la spécification fonctionnelle de l'application AML PROJECT au format PDF.

Le document est produit à partir des règles portées par le code : référentiel
métier (`core/models`), jeu de données (`core/data`), store d'alertes et écrans.
Toute évolution de ces règles doit être répercutée ici, puis le PDF régénéré :

    python3 tools/generate-spec-pdf.py

Le fichier produit est SPECIFICATION-FONCTIONNELLE.pdf, à la racine du dépôt.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

# --- Identité visuelle, reprise des jetons de design de l'application --------

NAVY = colors.HexColor("#002b7f")
NAVY_DARK = colors.HexColor("#001f5c")
PINK = colors.HexColor("#d31265")
MUTED = colors.HexColor("#60708a")
LINE = colors.HexColor("#d8e0ea")
SURFACE_2 = colors.HexColor("#f4f7fb")
GREEN = colors.HexColor("#12833b")
RED = colors.HexColor("#bd1e2d")
INK = colors.HexColor("#17191d")

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "SPECIFICATION-FONCTIONNELLE.pdf"

VERSION = "1.0"
DATE = "11 août 2026"

PAGE_W, PAGE_H = A4
MARGIN_X = 20 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X


# =============================================================================
# Styles
# =============================================================================


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles: dict[str, ParagraphStyle] = {}

    styles["cover_kicker"] = ParagraphStyle(
        "cover_kicker",
        parent=base["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=PINK,
        leading=14,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=30,
        textColor=NAVY,
        leading=36,
        spaceAfter=4,
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=13,
        textColor=MUTED,
        leading=19,
        alignment=TA_CENTER,
    )

    styles["h1"] = ParagraphStyle(
        "h1",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        textColor=NAVY,
        leading=21,
        spaceBefore=2,
        spaceAfter=10,
    )
    styles["h2"] = ParagraphStyle(
        "h2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        textColor=NAVY_DARK,
        leading=16,
        spaceBefore=14,
        spaceAfter=5,
    )
    styles["h3"] = ParagraphStyle(
        "h3",
        parent=base["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        textColor=PINK,
        leading=14,
        spaceBefore=10,
        spaceAfter=3,
    )

    styles["body"] = ParagraphStyle(
        "body",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        textColor=INK,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        parent=styles["body"],
        leftIndent=12,
        bulletIndent=3,
        spaceAfter=3,
    )
    styles["note"] = ParagraphStyle(
        "note",
        parent=styles["body"],
        fontSize=8.8,
        textColor=MUTED,
        leading=12.5,
        spaceAfter=8,
    )
    styles["caption"] = ParagraphStyle(
        "caption",
        parent=base["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=MUTED,
        leading=11,
        spaceBefore=3,
        spaceAfter=10,
    )

    # Styles internes aux tableaux : le retour à la ligne y est indispensable,
    # les libellés métier étant longs.
    styles["th"] = ParagraphStyle(
        "th",
        parent=base["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.2,
        textColor=colors.white,
        leading=10.5,
    )
    styles["td"] = ParagraphStyle(
        "td",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        textColor=INK,
        leading=10.8,
    )
    styles["td_code"] = ParagraphStyle(
        "td_code",
        parent=styles["td"],
        fontName="Courier",
        fontSize=7.6,
    )
    styles["td_strong"] = ParagraphStyle(
        "td_strong",
        parent=styles["td"],
        fontName="Helvetica-Bold",
    )

    styles["toc1"] = ParagraphStyle(
        "toc1",
        parent=base["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=NAVY,
        leading=17,
        spaceBefore=6,
    )
    styles["toc2"] = ParagraphStyle(
        "toc2",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=INK,
        leading=14,
        leftIndent=14,
    )
    return styles


S = build_styles()


# =============================================================================
# Fabriques de contenu
# =============================================================================

_counters = {"h1": 0, "h2": 0, "rg": 0}


def h1(text: str) -> Paragraph:
    _counters["h1"] += 1
    _counters["h2"] = 0
    number = _counters["h1"]
    para = Paragraph(f"{number}. {text}", S["h1"])
    para.toc_level, para.toc_text = 0, f"{number}. {text}"
    return para


def h2(text: str) -> Paragraph:
    _counters["h2"] += 1
    number = f"{_counters['h1']}.{_counters['h2']}"
    para = Paragraph(f"{number} {text}", S["h2"])
    para.toc_level, para.toc_text = 1, f"{number} {text}"
    return para


def h3(text: str) -> Paragraph:
    return Paragraph(text, S["h3"])


def p(text: str) -> Paragraph:
    return Paragraph(text, S["body"])


def note(text: str) -> Paragraph:
    return Paragraph(text, S["note"])


def caption(text: str) -> Paragraph:
    return Paragraph(text, S["caption"])


def bullets(items: list[str]) -> list[Paragraph]:
    return [Paragraph(item, S["bullet"], bulletText="•") for item in items]


def code(text: str) -> str:
    """Met en évidence un identifiant technique dans un paragraphe."""
    return f'<font face="Courier" size="8.6">{text}</font>'


def table(
    header: list[str],
    rows: list[list[str]],
    widths: list[float],
    *,
    code_columns: tuple[int, ...] = (),
    strong_columns: tuple[int, ...] = (),
    align: str = "LEFT",
) -> Table:
    """Tableau à en-tête marine, lignes zébrées et cellules qui se replient."""
    data = [[Paragraph(cell, S["th"]) for cell in header]]

    for row in rows:
        line = []
        for index, cell in enumerate(row):
            if index in code_columns:
                style = S["td_code"]
            elif index in strong_columns:
                style = S["td_strong"]
            else:
                style = S["td"]
            line.append(Paragraph(cell, style))
        data.append(line)

    total = sum(widths)
    scaled = [width / total * CONTENT_W for width in widths]

    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ]
    for index in range(1, len(data)):
        if index % 2 == 0:
            style.append(("BACKGROUND", (0, index), (-1, index), SURFACE_2))

    result = Table(data, colWidths=scaled, repeatRows=1, hAlign=align)
    result.setStyle(TableStyle(style))
    # Le tableau respire de lui-même : sans cela il touche le paragraphe suivant.
    result.spaceBefore = 2
    result.spaceAfter = 10
    return result


def rule_block(title: str, text: str) -> KeepTogether:
    """Encadré d'une règle de gestion, numérotée automatiquement."""
    _counters["rg"] += 1
    reference = f"RG-{_counters['rg']:02d}"
    inner = Table(
        [
            [
                Paragraph(f"<b>{reference}</b>", S["td"]),
                Paragraph(f"<b>{title}</b><br/>{text}", S["td"]),
            ]
        ],
        colWidths=[18 * mm, CONTENT_W - 18 * mm],
    )
    inner.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (0, 0), SURFACE_2),
                ("TEXTCOLOR", (0, 0), (0, 0), PINK),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LINEAFTER", (0, 0), (0, 0), 0.6, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return KeepTogether([inner, Spacer(1, 4)])


# =============================================================================
# Gabarit du document
# =============================================================================


class SpecDocTemplate(BaseDocTemplate):
    """Document à deux gabarits : couverture nue, puis pages à bandeau."""

    def afterFlowable(self, flowable) -> None:
        level = getattr(flowable, "toc_level", None)
        if level is not None:
            self.notify("TOCEntry", (level, flowable.toc_text, self.page))


def draw_cover(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, stroke=0, fill=1)
    canvas.setFillColor(PINK)
    canvas.rect(0, PAGE_H - 16 * mm, PAGE_W, 2 * mm, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.restoreState()


def draw_page(canvas, doc) -> None:
    canvas.saveState()

    # Bandeau supérieur : le titre à gauche, le nom de l'application à droite.
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 4 * mm, PAGE_W, 4 * mm, stroke=0, fill=1)

    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, PAGE_H - 12 * mm, "Spécification fonctionnelle détaillée")
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 12 * mm, "AML PROJECT")

    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, PAGE_H - 14 * mm, PAGE_W - MARGIN_X, PAGE_H - 14 * mm)

    # Pied de page : version à gauche, numéro de page à droite.
    canvas.line(MARGIN_X, 14 * mm, PAGE_W - MARGIN_X, 14 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 9.5 * mm, f"Version {VERSION} — {DATE}")
    canvas.drawRightString(PAGE_W - MARGIN_X, 9.5 * mm, f"Page {canvas.getPageNumber()}")

    canvas.restoreState()


def build_document() -> SpecDocTemplate:
    doc = SpecDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        title="AML PROJECT — Spécification fonctionnelle détaillée",
        author="Équipe Conformité LCB-FT",
        subject="Traitement des alertes de screening Sanction / PEP / RCA / HRTC",
        creator="tools/generate-spec-pdf.py",
    )

    cover_frame = Frame(MARGIN_X, 30 * mm, CONTENT_W, PAGE_H - 70 * mm, id="cover")
    body_frame = Frame(MARGIN_X, 18 * mm, CONTENT_W, PAGE_H - 38 * mm, id="body")

    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="body", frames=[body_frame], onPage=draw_page),
        ]
    )
    return doc


# =============================================================================
# Contenu
# =============================================================================


def cover(story: list) -> None:
    story.append(Spacer(1, 38 * mm))
    story.append(Paragraph("Conformité LCB-FT — Screening des tiers", S["cover_kicker"]))
    story.append(Paragraph("AML PROJECT", S["cover_title"]))
    story.append(
        Paragraph(
            "Spécification fonctionnelle détaillée<br/>"
            "Plateforme de traitement des alertes de screening",
            S["cover_sub"],
        )
    )
    story.append(Spacer(1, 24 * mm))

    meta = table(
        ["Rubrique", "Contenu"],
        [
            ["Objet du document", "Spécification fonctionnelle détaillée de l'application"],
            ["Périmètre", "Alertes Sanction (gel des avoirs), PEP, RCA et HRTC"],
            ["Version", VERSION],
            ["Date", DATE],
            ["Statut", "Diffusable — décrit l'application telle qu'implémentée"],
            [
                "Public visé",
                "Conformité LCB-FT, maîtrise d'ouvrage, équipe de développement, "
                "recette fonctionnelle, audit interne",
            ],
            [
                "Source",
                "Rédigée à partir du code de l'application : référentiel métier, "
                "jeu de données et écrans",
            ],
        ],
        [26, 74],
        strong_columns=(0,),
    )
    story.append(meta)

    story.append(Spacer(1, 14 * mm))
    story.append(
        note(
            "Avertissement — les entités, sous-entités, identifiants système, comptes "
            "utilisateurs, personnes et alertes cités dans ce document sont <b>fictifs</b>. "
            "Ils constituent un jeu de démonstration et ne désignent aucune organisation, "
            "aucune personne réelle et aucune mesure de gel effective."
        )
    )
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())


def toc(story: list) -> None:
    heading = Paragraph("Sommaire", S["h1"])
    story.append(heading)
    contents = TableOfContents()
    contents.levelStyles = [S["toc1"], S["toc2"]]
    contents.dotsMinLevel = 0
    story.append(contents)
    story.append(PageBreak())


def section_introduction(story: list) -> None:
    story.append(h1("Objet et périmètre"))

    story.append(h2("Objet du document"))
    story.append(
        p(
            "Ce document décrit le comportement attendu de l'application <b>AML PROJECT</b>, "
            "poste de travail des analystes conformité chargés de traiter les alertes issues du "
            "screening des tiers. Il énonce, écran par écran, les données affichées, les actions "
            "offertes et les règles qui les encadrent. Il sert de référence commune à la maîtrise "
            "d'ouvrage, à l'équipe de développement et à la recette fonctionnelle."
        )
    )
    story.append(
        p(
            "Les règles décrites ici sont celles portées par l'application. Elles sont numérotées "
            f"{code('RG-nn')} et regroupées au chapitre 7, où chacune renvoie au comportement "
            "observable de l'écran concerné."
        )
    )

    story.append(h2("Contexte métier"))
    story.append(
        p(
            "Le dispositif de lutte contre le blanchiment de capitaux et le financement du "
            "terrorisme (LCB-FT) impose de contrôler les tiers d'un groupe d'assurance contre les "
            "listes de sanctions internationales, les listes de personnes politiquement exposées "
            "et les listes de pays tiers à haut risque. Un moteur de screening rapproche en "
            "continu le référentiel des personnes du groupe avec les fiches d'un fournisseur de "
            "données. Chaque rapprochement dont le taux de similarité dépasse le seuil retenu "
            "génère une <b>alerte</b>, qu'un analyste doit lever ou confirmer."
        )
    )
    story.append(
        p(
            "L'application n'exécute pas le screening : elle prend le relais à partir de l'alerte "
            "générée. Sa raison d'être est de porter la chaîne de décision — qui a vu "
            "l'alerte, ce qu'il en a conclu, sur quel fondement, et à quelle date — dans une "
            "forme opposable en cas de contrôle."
        )
    )

    story.append(h2("Périmètre fonctionnel"))
    story.append(p("<b>Dans le périmètre :</b>"))
    story.extend(
        bullets(
            [
                "consultation des alertes ouvertes, des alertes affectées au compte connecté et "
                "des alertes déjà traitées ;",
                "filtrage, tri, pagination et export des corbeilles d'alertes ;",
                "affectation d'une alerte à un analyste, individuellement ou par lot ;",
                "analyse d'une alerte : identité de la personne, tableau de rapprochement par "
                "similarité, historique des événements ;",
                "prise de décision de niveau 1 et de niveau 2, avec justification obligatoire ;",
                "ajout de commentaires tracés sur l'alerte ;",
                "recherche d'une personne physique ou morale dans le référentiel ;",
                "consultation du profil de risque d'une personne et de l'ensemble de ses alertes.",
            ]
        )
    )
    story.append(p("<b>Hors périmètre :</b>"))
    story.extend(
        bullets(
            [
                "le moteur de screening lui-même, ses algorithmes de similarité et ses seuils de "
                "déclenchement ;",
                "l'alimentation du référentiel des personnes et l'abonnement aux listes du "
                "fournisseur de données ;",
                "la déclaration de soupçon auprès de l'autorité compétente, instruite dans un "
                "outil dédié ;",
                "l'administration des habilitations, assurée par le fournisseur d'identité du "
                "groupe ;",
                "le blocage opérationnel des contrats et des flux financiers, exécuté par les "
                "systèmes de gestion.",
            ]
        )
    )

    story.append(h2("Définitions"))
    story.append(
        table(
            ["Terme", "Définition"],
            [
                [
                    "Alerte",
                    "Rapprochement, calculé par le moteur de screening, entre une personne du "
                    "référentiel du groupe et une fiche listée, dont le taux de similarité "
                    "dépasse le seuil de déclenchement.",
                ],
                [
                    "Typologie",
                    "Dispositif de screening à l'origine de l'alerte : gel des avoirs, personne "
                    "politiquement exposée, proche ou associé, ou pays tiers à haut risque.",
                ],
                [
                    "Personne",
                    "Tiers du référentiel : personne physique (<i>Natural Person</i>) ou personne "
                    "morale (<i>Legal Entity</i>).",
                ],
                [
                    "Rapprochement",
                    "Tableau confrontant l'état civil du référentiel aux fiches listées "
                    "candidates, ligne à ligne et champ par champ.",
                ],
                [
                    "Taux de similarité",
                    "Pourcentage calculé par le moteur, exprimant la proximité entre la personne "
                    "et une fiche listée. Le taux maximal de l'alerte est celui de la fiche la "
                    "plus proche.",
                ],
                [
                    "Niveau 1",
                    "Premier filtre. Écarte les correspondances manifestement fausses et escalade "
                    "les cas nécessitant une analyse approfondie.",
                ],
                [
                    "Niveau 2",
                    "Analyste conformité de l'entité. Prononce les décisions de clôture et "
                    "d'inscription sous mesure de gel.",
                ],
                [
                    "Corbeille",
                    "Vue tabulaire d'un ensemble d'alertes partageant un même périmètre : les "
                    "miennes, les ouvertes, les traitées.",
                ],
                [
                    "Décision",
                    "Acte de clôture ou d'escalade d'une alerte, prononcé par un analyste "
                    "habilité et assorti d'une justification.",
                ],
                [
                    "Profil de risque",
                    "Synthèse, pour une personne donnée, du niveau de risque de chaque dispositif "
                    "de screening et de la totalité de ses alertes.",
                ],
            ],
            [20, 80],
            strong_columns=(0,),
        )
    )


def section_actors(story: list) -> None:
    story.append(h1("Acteurs et habilitations"))

    story.append(h2("Groupes d'habilitation"))
    story.append(
        p(
            "L'application connaît deux groupes. Le groupe détermine les décisions qu'un compte "
            "peut prononcer et les actions transverses qui lui sont ouvertes. Il n'existe pas de "
            "profil administrateur dans le périmètre."
        )
    )
    story.append(
        table(
            ["Groupe", "Libellé affiché", "Rôle"],
            [
                [
                    "LEVEL_1",
                    "Level 1",
                    "Premier filtre. Écarte les correspondances manifestement fausses et escalade "
                    "les cas nécessitant une analyse approfondie.",
                ],
                [
                    "LEVEL_2",
                    "Level 2",
                    "Analyste conformité de l'entité. Prononce les décisions de clôture et "
                    "d'inscription sous mesure de gel.",
                ],
            ],
            [16, 16, 68],
            code_columns=(0,),
        )
    )

    story.append(h2("Matrice des droits"))
    story.append(
        p(
            "Chaque action de l'application est gouvernée par une permission. La matrice ci-après "
            "est la référence : une case vide signifie que la commande correspondante n'est pas "
            "présentée au compte connecté."
        )
    )
    story.append(
        table(
            ["Permission", "Action gouvernée", "Level 1", "Level 2"],
            [
                ["alert:view", "Consulter une alerte et son historique", "Oui", "Oui"],
                ["alert:comment", "Ajouter un commentaire tracé sur l'alerte", "Oui", "Oui"],
                ["alert:assign", "S'affecter une alerte", "Oui", "Oui"],
                ["alert:assign-others", "Affecter une alerte à un autre analyste", "—", "Oui"],
                ["person:search", "Rechercher une personne dans le référentiel", "Oui", "Oui"],
                ["decision:clear-l1", "Écarter une alerte au niveau 1", "Oui", "—"],
                ["decision:escalate", "Escalader une alerte vers le niveau 2", "Oui", "—"],
                ["decision:clear-l2", "Écarter une alerte au niveau 2", "—", "Oui"],
                ["decision:blacklist", "Inscrire la personne sous mesure de gel", "—", "Oui"],
                ["export:alerts", "Exporter une sélection d'alertes", "—", "Oui"],
            ],
            [24, 48, 14, 14],
            code_columns=(0,),
        )
    )
    story.append(
        caption(
            "Lecture : le niveau 2 ne dispose pas des décisions de niveau 1. Un dossier écarté au "
            "niveau 1 et un dossier écarté au niveau 2 n'ont pas la même portée ; les confondre "
            "reviendrait à masquer le niveau réel d'examen dans les statistiques de contrôle."
        )
    )
    story.append(
        note(
            "Portée technique — ces permissions pilotent l'affichage : elles masquent les "
            "commandes indisponibles afin de réduire le bruit et les erreurs de manipulation. "
            "Elles ne constituent pas une couche de sécurité. Toute action doit être revalidée "
            "côté serveur, seul juge de l'habilitation réelle du compte."
        )
    )

    story.append(h2("Comptes de démonstration"))
    story.append(
        p(
            "Six comptes fictifs permettent de parcourir l'application sous chaque niveau "
            "d'habilitation. Le bandeau applicatif expose un sélecteur de compte : en "
            f"déploiement réel, l'identité proviendrait du fournisseur d'identité du groupe. Le "
            f"compte ouvert par défaut est {code('STRAN')}."
        )
    )
    story.append(
        table(
            ["Identifiant", "Nom affiché", "Groupe", "Filiale de rattachement"],
            [
                ["STRAN", "TRAN Sébastien", "Level 2", "Lumina Vita"],
                ["ADUBOIS", "DUBOIS Alice", "Level 2", "Nordia Life"],
                ["MRENARD", "RENARD Marc", "Level 2", "Helvia Insurance"],
                ["LFONTAINE", "FONTAINE Léa", "Level 2", "Nordia Life"],
                ["PMOREAU", "MOREAU Paul", "Level 1", "Lumina Vita"],
                ["CGARNIER", "GARNIER Chloé", "Level 1", "Astrea Assurances"],
            ],
            [18, 26, 16, 40],
            code_columns=(0,),
        )
    )
    story.append(
        caption(
            "Le nom affiché dans le bandeau suit la forme « NOM Prénom », patronyme en capitales."
        )
    )


def section_reference(story: list) -> None:
    story.append(h1("Référentiel métier"))
    story.append(
        p(
            "Les énumérations décrites dans ce chapitre constituent la source de vérité de "
            "l'application. Aucun écran ne redéfinit localement un libellé, un code ou une "
            "couleur : tous les lisent au même endroit, ce qui garantit qu'un statut est nommé et "
            "coloré de façon identique dans une corbeille, dans l'écran de traitement et dans un "
            "profil de risque."
        )
    )

    story.append(h2("Typologies d'alerte"))
    story.append(
        p(
            "L'application ne connaît que quatre typologies. Elles correspondent aux quatre "
            "dispositifs de screening du groupe et ne sont pas extensibles par paramétrage : "
            "toute typologie supplémentaire relève d'une évolution de la présente spécification."
        )
    )
    story.append(
        table(
            ["Code", "Libellé affiché", "Libellé français", "Fait générateur"],
            [
                [
                    "SANCTION",
                    "Asset Freeze",
                    "Gel des avoirs",
                    "Correspondance avec une personne ou une entité figurant sur une liste de "
                    "sanctions internationales (UE, OFAC, ONU, HM Treasury).",
                ],
                [
                    "PEP",
                    "Politically Exposed Person",
                    "Personne politiquement exposée",
                    "Correspondance avec une personne exerçant ou ayant exercé une fonction "
                    "publique importante, soumise à une vigilance renforcée.",
                ],
                [
                    "RCA",
                    "Relatives and Close Associates",
                    "Proche ou associé d'une personne listée",
                    "Correspondance avec un membre de la famille ou un associé proche d'une "
                    "personne politiquement exposée ou sanctionnée.",
                ],
                [
                    "HRTC",
                    "High Risk Third Country",
                    "Pays tiers à haut risque",
                    "Rattachement du client à un pays tiers présentant des carences stratégiques "
                    "dans son dispositif de lutte contre le blanchiment.",
                ],
            ],
            [11, 22, 22, 45],
            code_columns=(0,),
        )
    )
    story.append(
        caption(
            "Une alerte HRTC ne procède pas d'un rapprochement nominatif mais d'un rattachement "
            "géographique : elle ne porte donc pas d'identifiant de fiche listée, et son détail "
            "affiche un code pays au lieu d'une référence de fiche."
        )
    )

    story.append(h2("Statuts et cycle de vie"))
    story.append(
        p(
            "Une alerte porte à tout instant un et un seul statut, parmi huit. Les quatre "
            "premiers sont des statuts d'alerte <b>ouverte</b>, les quatre derniers des statuts "
            "<b>terminaux</b>. Cette partition détermine à elle seule la corbeille dans laquelle "
            "l'alerte apparaît."
        )
    )
    story.append(
        table(
            ["Statut", "Nature", "Niveau en charge", "Signification"],
            [
                [
                    "TO_CLEAR_L1",
                    "Ouverte",
                    "1",
                    "Alerte générée par le moteur de screening, en attente de prise en charge.",
                ],
                ["IN_PROCESS_L1", "Ouverte", "1", "Analyse en cours par un analyste de niveau 1."],
                [
                    "ESCALATED_L2",
                    "Ouverte",
                    "2",
                    "Transmise au niveau 2 pour décision réglementaire.",
                ],
                ["IN_PROCESS_L2", "Ouverte", "2", "Analyse en cours par un analyste de niveau 2."],
                [
                    "CLEARED_L1",
                    "Terminale",
                    "1",
                    "Alerte écartée au niveau 1 : aucun risque retenu.",
                ],
                [
                    "CLEARED_L2",
                    "Terminale",
                    "2",
                    "Alerte écartée au niveau 2 : aucun risque retenu.",
                ],
                [
                    "ENFORCED_SCRUTINY",
                    "Terminale",
                    "2",
                    "Client placé sous vigilance renforcée à la suite de la décision.",
                ],
                [
                    "BLACKLISTED",
                    "Terminale",
                    "2",
                    "Correspondance avérée : le client est inscrit sous mesure de gel.",
                ],
            ],
            [21, 13, 13, 53],
            code_columns=(0,),
        )
    )

    story.append(h3("Transitions"))
    story.append(
        table(
            ["Statut de départ", "Événement", "Statut d'arrivée", "Acteur"],
            [
                [
                    "—",
                    "Génération du rapprochement par le moteur de screening",
                    "TO_CLEAR_L1",
                    "Moteur",
                ],
                [
                    "TO_CLEAR_L1",
                    "Affectation à un analyste",
                    "IN_PROCESS_L1",
                    "Level 1 ou Level 2",
                ],
                [
                    "IN_PROCESS_L1",
                    "Décision « Cleared alert - No Risk - Level 1 »",
                    "CLEARED_L1",
                    "Level 1",
                ],
                ["IN_PROCESS_L1", "Décision « Escalate to Level 2 »", "ESCALATED_L2", "Level 1"],
                [
                    "ESCALATED_L2",
                    "Affectation à un analyste (le statut est conservé)",
                    "ESCALATED_L2",
                    "Level 2",
                ],
                [
                    "ESCALATED_L2 / IN_PROCESS_L2",
                    "Décision « Cleared alert - No Risk - Level 2 »",
                    "CLEARED_L2",
                    "Level 2",
                ],
                [
                    "ESCALATED_L2 / IN_PROCESS_L2",
                    "Décision « Blacklisted - Under Sanctions »",
                    "BLACKLISTED",
                    "Level 2",
                ],
                [
                    "—",
                    "Mise sous vigilance renforcée du profil client",
                    "ENFORCED_SCRUTINY",
                    "Level 2",
                ],
            ],
            [26, 38, 22, 14],
            code_columns=(0, 2),
        )
    )
    story.append(
        caption(
            "Le statut IN_PROCESS_L2 est restitué par l'application mais n'est produit par aucune "
            "action d'écran : sa pose relève du système amont lors de la prise en charge par le "
            "niveau 2. De même, ENFORCED_SCRUTINY découle d'une revue périodique du profil client "
            "et non de la clôture d'une alerte — raison pour laquelle il n'est pas proposé "
            "dans le panneau de décision."
        )
    )

    story.append(h2("Décisions"))
    story.append(
        p(
            "Une décision clôt l'analyse d'une alerte ou la transmet au niveau supérieur. Elle "
            "est prononcée depuis l'écran de traitement, dans le panneau <i>Decisions</i>, et "
            "détermine le statut porté ensuite par l'alerte."
        )
    )
    story.append(
        table(
            [
                "Libellé du choix",
                "Libellé français",
                "Niveau requis",
                "Statut résultant",
                "Conséquence",
            ],
            [
                [
                    "Cleared alert - No Risk - Level 1",
                    "Écartée",
                    "Level 1",
                    "CLEARED_L1",
                    "L'alerte est clôturée sans suite. Aucune mesure de vigilance renforcée n'est "
                    "déclenchée sur la personne.",
                ],
                [
                    "Escalate to Level 2",
                    "Escaladée",
                    "Level 1",
                    "ESCALATED_L2",
                    "L'alerte est transmise au niveau 2 pour décision réglementaire.",
                ],
                [
                    "Cleared alert - No Risk - Level 2",
                    "Validée",
                    "Level 2",
                    "CLEARED_L2",
                    "L'alerte est clôturée après analyse de niveau 2. Le rapprochement est "
                    "mémorisé afin de limiter la régénération d'alertes identiques.",
                ],
                [
                    "Blacklisted - Under Sanctions",
                    "Blacklistée",
                    "Level 2",
                    "BLACKLISTED",
                    "La personne est inscrite sous mesure de gel des avoirs, la relation "
                    "d'affaires est bloquée et un dossier de déclaration de soupçon est ouvert.",
                ],
                [
                    "Enforced scrutiny <i>(non proposé)</i>",
                    "Vigilance renforcée",
                    "Level 2",
                    "ENFORCED_SCRUTINY",
                    "La personne est placée sous vigilance renforcée : ses opérations font "
                    "l'objet d'un suivi rapproché.",
                ],
            ],
            [24, 14, 11, 18, 33],
            code_columns=(3,),
        )
    )
    story.append(
        caption(
            "Les quatre premières décisions sont proposées dans le panneau, au niveau indiqué. La "
            "cinquième ne l'est pas : elle qualifie un profil client, pas l'issue d'une alerte."
        )
    )

    story.append(h2("Niveaux de risque du profil client"))
    story.append(
        p(
            "Le profil de risque d'une personne se décompose en une note par dispositif de "
            "screening. Chaque note prend l'une des cinq valeurs ci-dessous, ordonnées par "
            "sévérité croissante."
        )
    )
    story.append(
        table(
            ["Sévérité", "Niveau", "Couleur", "Lecture"],
            [
                [
                    "1",
                    "Sans risque",
                    "Vert",
                    "Aucun rapprochement retenu sur ce dispositif au dernier contrôle.",
                ],
                [
                    "2",
                    "Données incomplètes",
                    "Gris",
                    "Le contrôle n'a pas pu être conclu : le référentiel ne porte pas les "
                    "éléments d'identité nécessaires.",
                ],
                [
                    "3",
                    "Alerte en cours",
                    "Orange",
                    "Au moins une alerte ouverte est en cours d'analyse sur ce dispositif.",
                ],
                [
                    "4",
                    "Vigilance renforcée",
                    "Rouge",
                    "La personne fait l'objet d'un suivi rapproché de ses opérations.",
                ],
                [
                    "5",
                    "Blacklisté",
                    "Noir",
                    "La personne est inscrite sous mesure de gel des avoirs.",
                ],
            ],
            [11, 22, 12, 55],
        )
    )

    story.append(h2("Autres énumérations"))
    story.append(
        table(
            ["Énumération", "Valeurs", "Usage"],
            [
                [
                    "Type de personne",
                    "Natural Person, Legal Entity",
                    "Commande les blocs d'identité affichés, les critères de recherche et les "
                    "colonnes de résultat.",
                ],
                [
                    "Circuit",
                    "Temps réel, Batch",
                    "Mode d'alimentation du moteur de screening ayant produit l'alerte.",
                ],
                [
                    "Source de rapprochement",
                    "PERSON, FACTIVA",
                    "Origine d'une ligne du tableau de rapprochement : le référentiel du groupe "
                    "ou une fiche du fournisseur de données.",
                ],
                [
                    "Action tracée",
                    "Alert generated, Alert assigned, Status changed, Comment added, "
                    "Decision taken",
                    "Nature de l'événement inscrit au journal de l'alerte.",
                ],
            ],
            [20, 32, 48],
            strong_columns=(0,),
        )
    )


def section_data_model(story: list) -> None:
    story.append(h1("Modèle de données fonctionnel"))
    story.append(
        p(
            "Ce chapitre décrit les objets manipulés par les écrans et leurs attributs "
            "significatifs. Il n'engage pas de choix de persistance : il fixe ce que "
            "l'application doit connaître de chaque objet pour rendre les écrans spécifiés au "
            "chapitre 6."
        )
    )

    story.append(h2("Alerte"))
    story.append(
        table(
            ["Attribut", "Type", "Description"],
            [
                ["id", "Entier", "Identifiant métier, affiché en colonne « Alert ID »."],
                [
                    "reference",
                    "Texte",
                    "Référence lisible de la forme ALERTE-2026-001, affichée sur le profil de "
                    "risque.",
                ],
                ["status", "Statut", "Statut courant, parmi les huit valeurs du chapitre 3.2."],
                ["typology", "Typologie", "Dispositif de screening à l'origine de l'alerte."],
                ["personId", "Texte", "Identifiant de la personne screenée."],
                ["personType", "Type de personne", "Personne physique ou personne morale."],
                [
                    "systemId, entity, subEntity",
                    "Texte",
                    "Rattachement organisationnel, hérité de la filiale de la personne.",
                ],
                ["alertDate", "Date (JJ/MM/AAAA)", "Date de génération de l'alerte."],
                [
                    "alertDateTime",
                    "Horodatage",
                    "Date et heure de génération, affichées sur l'écran de traitement.",
                ],
                [
                    "maxRate",
                    "Décimal",
                    "Taux de similarité maximal du rapprochement, en pourcentage, restitué avec "
                    "quatre décimales.",
                ],
                [
                    "factivaId",
                    "Texte ou vide",
                    "Identifiant de la fiche du fournisseur de données. Absent pour une alerte "
                    "HRTC.",
                ],
                [
                    "detail",
                    "Texte",
                    "Référence de la fiche listée, ou code pays pour une alerte HRTC.",
                ],
                ["circuit", "Circuit", "Temps réel ou batch."],
                [
                    "userGroup, user",
                    "Groupe, texte",
                    "Groupe et identifiant de l'analyste affecté. Vides tant que l'alerte n'est "
                    "pas prise en charge.",
                ],
                [
                    "reconciliation",
                    "Liste",
                    "Lignes du tableau de rapprochement : une ligne de référence puis les fiches "
                    "candidates.",
                ],
                [
                    "decision, justification, processedAt",
                    "Décision, texte, date",
                    "Issue de l'analyse. Vides tant que l'alerte est ouverte.",
                ],
            ],
            [24, 18, 58],
            code_columns=(0,),
        )
    )

    story.append(h2("Ligne de rapprochement"))
    story.append(
        p(
            "Une ligne confronte, champ par champ, l'identité connue du référentiel et celle "
            "d'une fiche listée. Elle porte treize colonnes : source, taux, nom, nom alternatif, "
            "prénom usuel, liste des prénoms, sexe, date de naissance, année de naissance, code "
            "du lieu de naissance, pays de naissance, code pays de l'adresse et pays de "
            "nationalité. La ligne de source PERSON ne porte pas de taux : elle est la référence "
            "contre laquelle les taux sont calculés."
        )
    )

    story.append(h2("Personne"))
    story.append(
        table(
            ["Bloc", "Contenu"],
            [
                [
                    "Identification",
                    "Identifiant personne, identifiant partenaire, identifiant RIC, identifiant "
                    "système, entité, sous-entité, horodatage de dernière mise à jour.",
                ],
                [
                    "État civil (personne physique)",
                    "Nom, nom alternatif, prénom usuel, liste des prénoms, sexe, date de "
                    "naissance, code du lieu de naissance, pays de naissance.",
                ],
                [
                    "Signalétique (personne morale)",
                    "Raison sociale, forme juridique, référence, pays d'immatriculation, domaine "
                    "d'activité, date de création, identifiant société.",
                ],
                ["Contact", "Adresse électronique, téléphone."],
                ["Coordonnées bancaires", "IBAN."],
                [
                    "Coordonnées postales",
                    "Cinq lignes d'adresse normalisées, code postal, ville, code pays.",
                ],
                ["Contrat", "Numéro de contrat, rôle tenu par la personne sur ce contrat."],
                [
                    "Liens",
                    "Liens vers d'autres personnes : type de lien, personne et entité de départ, "
                    "personne et entité liées.",
                ],
                [
                    "Profil de risque",
                    "Une composante par dispositif de screening : typologie, niveau de risque, "
                    "date du dernier contrôle.",
                ],
            ],
            [26, 74],
            strong_columns=(0,),
        )
    )
    story.append(
        caption(
            "Un champ non renseigné par le référentiel est affiché « - » sur tous les écrans, "
            "jamais laissé vide : l'absence de donnée doit se distinguer d'une zone d'affichage "
            "défaillante."
        )
    )

    story.append(h2("Événement d'historique"))
    story.append(
        p(
            "Chaque événement porte un horodatage, l'action tracée, l'auteur et son groupe, la "
            "valeur précédente, la valeur nouvelle et un commentaire éventuel. L'auteur est vide "
            "pour les événements produits par le moteur de screening. Le journal est traité comme "
            "un registre en écriture seule : aucun écran n'expose de modification ni de "
            "suppression d'entrée."
        )
    )

    story.append(h2("Filiale"))
    story.append(
        p(
            "Une filiale porte un identifiant, un nom, un pays, une sous-entité et un identifiant "
            "système. L'identifiant système est porté par la filiale et non par la personne : "
            f"c'est ce qui garantit structurellement qu'une filiale n'expose qu'un identifiant "
            "système, sans qu'aucun jeu de données puisse en introduire un second par "
            "inadvertance."
        )
    )


def section_navigation(story: list) -> None:
    story.append(h1("Cartographie et navigation"))

    story.append(h2("Bandeau applicatif"))
    story.append(
        p(
            "Le bandeau est présent sur tous les écrans. Il porte, de gauche à droite : le logo "
            "AML, le titre <b>AML PROJECT</b>, le compte connecté avec son sélecteur, et le "
            "sélecteur de langue. Sous cette première ligne figurent les quatre onglets de "
            "navigation. Il n'existe ni menu latéral ni second niveau de navigation : les quatre "
            "onglets sont les quatre points d'entrée de l'application."
        )
    )
    story.append(
        table(
            ["Onglet", "Chemin", "Écran ouvert"],
            [
                ["My alerts", "/my-alerts", "Corbeille des alertes ouvertes affectées au compte."],
                ["Alert Basket", "/alert-basket", "Corbeille de toutes les alertes ouvertes."],
                ["Processed alerts", "/processed-alerts", "Corbeille des alertes traitées."],
                ["Search person", "/search-person", "Recherche d'une personne au référentiel."],
            ],
            [22, 24, 54],
            code_columns=(1,),
        )
    )

    story.append(h2("Écrans de détail"))
    story.append(
        p(
            "Deux écrans n'ont pas d'onglet propre : ils s'ouvrent depuis les tableaux et se "
            "referment par le retour à l'écran d'origine."
        )
    )
    story.append(
        table(
            ["Écran", "Chemin", "Point d'entrée"],
            [
                [
                    "Traitement d'une alerte",
                    "/alerts/:alertId",
                    "Clic sur une ligne d'une corbeille, ou sur une ligne du tableau d'alertes "
                    "d'un profil de risque.",
                ],
                [
                    "Profil de risque",
                    "/person/:personId",
                    "Clic sur un résultat de recherche, ou commande d'ouverture du profil depuis "
                    "l'écran de traitement.",
                ],
            ],
            [26, 26, 48],
            code_columns=(1,),
        )
    )
    story.append(
        caption(
            "La racine redirige vers /alert-basket. Toute adresse inconnue est ramenée à la "
            "racine, sans page d'erreur intermédiaire."
        )
    )

    story.append(h2("Retours et titres"))
    story.append(
        p(
            "Le titre de l'onglet du navigateur suit la forme « <i>nom de l'écran</i> — AML "
            "PROJECT ». Le retour depuis l'écran de traitement rend la main à l'écran précédent "
            "dans l'historique de navigation, ce qui préserve la page, les filtres et le tri de "
            "la corbeille quittée."
        )
    )


def section_screens(story: list) -> None:
    story.append(h1("Spécification des écrans"))

    # --- Corbeilles ---------------------------------------------------------
    story.append(h2("Corbeilles d'alertes"))
    story.append(
        p(
            "Un même écran sert les trois onglets <i>My alerts</i>, <i>Alert Basket</i> et "
            "<i>Processed alerts</i>. Ils partagent le tableau, le panneau de filtres et le "
            "paginateur ; seuls le périmètre des alertes et les actions disponibles changent."
        )
    )
    story.append(
        table(
            ["Corbeille", "Périmètre", "Statuts filtrables", "Sélection de lignes"],
            [
                [
                    "My alerts",
                    "Alertes ouvertes dont l'analyste affecté est le compte connecté.",
                    "Les quatre statuts ouverts",
                    "Oui",
                ],
                [
                    "Alert Basket",
                    "Toutes les alertes ouvertes, quel que soit l'analyste affecté.",
                    "Les quatre statuts ouverts",
                    "Oui",
                ],
                [
                    "Processed alerts",
                    "Toutes les alertes portant un statut terminal.",
                    "Les quatre statuts terminaux",
                    "Non — corbeille en lecture seule",
                ],
            ],
            [18, 40, 22, 20],
            strong_columns=(0,),
        )
    )

    story.append(h3("Colonnes du tableau"))
    story.append(
        p(
            "Les douze colonnes sont affichées dans l'ordre suivant, toutes triables par clic sur "
            "l'en-tête. Le premier clic trie en ordre croissant, le second inverse le sens. À "
            "valeur égale, l'ordre des identifiants d'alerte maintient le tableau stable."
        )
    )
    story.append(
        table(
            ["Rang", "Colonne", "Contenu"],
            [
                ["1", "Status", "Statut courant, accompagné d'une pastille de couleur."],
                ["2", "Person ID", "Identifiant de la personne screenée."],
                ["3", "System ID", "Identifiant du système source de la filiale."],
                ["4", "Person type", "Natural Person ou Legal Entity."],
                ["5", "Alert date", "Date de génération de l'alerte."],
                ["6", "Alert ID", "Identifiant métier de l'alerte."],
                ["7", "Typology alert", "Libellé de la typologie."],
                ["8", "Sub-entity", "Sous-entité de rattachement."],
                ["9", "Entity", "Filiale de rattachement."],
                ["10", "User group", "Groupe de l'analyste affecté, ou « - »."],
                ["11", "User", "Identifiant de l'analyste affecté, ou « - »."],
                ["12", "Max rate (%)", "Taux de similarité maximal, à quatre décimales."],
            ],
            [8, 22, 70],
            strong_columns=(1,),
        )
    )

    story.append(h3("Panneau de filtres"))
    story.append(
        p(
            "La commande <i>Filter and sort</i> ouvre un panneau latéral. Les critères y sont "
            "saisis sans effet immédiat : ils ne s'appliquent qu'à la validation, ce qui évite de "
            "recalculer le tableau à chaque frappe et laisse composer un jeu de critères complet "
            "avant de le confronter aux données."
        )
    )
    story.append(
        table(
            ["Critère", "Nature", "Règle d'application"],
            [
                [
                    "Status",
                    "Cases à cocher, choix multiple",
                    "Aucune case cochée : tous les statuts du périmètre. Sinon, restriction aux "
                    "statuts cochés.",
                ],
                ["Person ID", "Texte libre", "Correspondance partielle, insensible à la casse."],
                ["System ID", "Texte libre", "Correspondance partielle, insensible à la casse."],
                ["Person type", "Liste", "Égalité stricte."],
                [
                    "Start date / End date",
                    "Dates",
                    "Bornes inclusives sur la date de génération. Chaque borne est "
                    "indépendamment facultative.",
                ],
                ["Alert ID", "Texte libre", "Correspondance partielle sur l'identifiant."],
                ["Typology", "Liste", "Égalité stricte."],
                ["Entity", "Liste des filiales", "Égalité stricte."],
                ["Sub-entity", "Liste des sous-entités", "Égalité stricte."],
                ["User group", "Liste", "Égalité stricte."],
                ["User", "Liste des comptes", "Égalité stricte."],
                [
                    "Min rate / Max rate",
                    "Nombres",
                    "Bornes inclusives sur le taux maximal. Chaque borne est indépendamment "
                    "facultative.",
                ],
            ],
            [20, 24, 56],
            strong_columns=(0,),
        )
    )
    story.append(
        caption(
            "Les critères se cumulent : une alerte n'est retenue que si elle satisfait tous les "
            "critères renseignés. Le panneau offre une commande de remise à zéro, active dès "
            "qu'un critère est saisi. Changer d'onglet remet la corbeille à son état d'ouverture "
            "— filtres vidés, sélection vide, première page."
        )
    )

    story.append(h3("Pagination"))
    story.append(
        p(
            "Le paginateur affiche l'étendue courante sous la forme « 1 - 10 of 706 » et permet "
            "de changer de page ainsi que de taille de page. Tout changement de tri, de filtre ou "
            "de taille de page ramène à la première page : conserver le rang de page après un "
            "changement de tri afficherait des lignes sans rapport avec celles que l'utilisateur "
            "consultait."
        )
    )

    story.append(h3("Actions groupées"))
    story.append(
        table(
            ["Action", "Condition", "Comportement"],
            [
                [
                    "Assign an alert",
                    "Au moins une ligne cochée ; corbeille non verrouillée.",
                    "Ouvre une fenêtre demandant le groupe, l'analyste destinataire et un "
                    "commentaire facultatif. À la validation, chaque alerte sélectionnée est "
                    "affectée et un événement d'affectation est tracé pour chacune.",
                ],
                [
                    "Export",
                    "Permission export:alerts.",
                    "Transmet au service d'export les alertes cochées ; à défaut de sélection, "
                    "la totalité du résultat filtré.",
                ],
            ],
            [18, 26, 56],
            strong_columns=(0,),
        )
    )
    story.append(
        caption(
            "Déclencher l'affectation sans aucune ligne cochée n'ouvre pas la fenêtre : "
            "l'application signale l'absence de sélection et laisse la corbeille en l'état."
        )
    )

    # --- Traitement ---------------------------------------------------------
    story.append(h2("Traitement d'une alerte"))
    story.append(
        p(
            "Poste de travail de l'analyste. L'écran présente l'en-tête de l'alerte, deux actions "
            "transverses — commenter, affecter — et trois onglets. La décision se prend "
            "dans l'onglet de l'alerte, sous le tableau de rapprochement qui la motive : "
            "l'analyste ne peut pas conclure sans avoir sous les yeux ce sur quoi il conclut."
        )
    )
    story.append(
        table(
            ["Onglet", "Libellé", "Contenu"],
            [
                [
                    "1",
                    "Person details - <i>type de personne</i>",
                    "Identification de la personne, état civil ou signalétique société, "
                    "coordonnées postales, contrat.",
                ],
                [
                    "2",
                    "Alert details - <i>typologie</i>",
                    "Identification de l'alerte, tableau de rapprochement par similarité, "
                    "panneau de décision.",
                ],
                [
                    "3",
                    "Alert history",
                    "Journal chronologique des événements et fil des commentaires.",
                ],
            ],
            [8, 30, 62],
        )
    )
    story.append(
        caption(
            "Le libellé des deux premiers onglets est contextuel : il porte le type de la "
            "personne et la typologie de l'alerte, de sorte que la nature du dossier reste "
            "lisible sans revenir à l'en-tête. L'onglet ouvert par défaut est <i>Alert "
            "details</i>."
        )
    )

    story.append(h3("Onglet 1 — la personne"))
    story.append(
        p(
            "Quatre cartes, chacune repliable indépendamment : <b>Person identification "
            "details</b> (identifiants et rattachement), <b>Person details</b> ou <b>Company "
            "details</b> selon le type (état civil ou signalétique société), <b>Postal "
            "address</b> (les cinq lignes normalisées, le code postal, la ville et le code pays) "
            "et <b>Contract</b> (numéro et rôle). Une commande ouvre le profil de risque complet "
            "de la personne."
        )
    )

    story.append(h3("Onglet 2 — l'alerte"))
    story.append(
        p(
            "<b>Alert identification details</b> restitue l'identifiant de l'alerte, son statut, "
            "sa typologie, son circuit, son horodatage de génération, le taux de similarité "
            "maximal, l'identifiant de la fiche listée et le rattachement organisationnel."
        )
    )
    story.append(
        p(
            "<b>Similarity-based reconciliation</b> confronte l'identité du référentiel aux "
            "fiches candidates sur treize colonnes. La ligne de source PERSON est la référence : "
            "elle reste en tête du tableau, hors pagination, afin de rester visible quelle que "
            "soit la page de fiches consultée. Le paginateur ne décompte que les fiches "
            "rapprochées."
        )
    )
    story.append(
        p(
            "<b>Decisions</b> présente, sous forme de boutons radio, les seules décisions "
            "ouvertes au niveau d'habilitation du compte connecté, une zone de justification et "
            "la commande de validation."
        )
    )

    story.append(h3("Onglet 3 — l'historique"))
    story.append(
        p(
            "Le journal restitue les événements du plus récent au plus ancien. Chaque ligne porte "
            "l'horodatage, l'action, l'auteur et son groupe, la valeur précédente, la valeur "
            "nouvelle et le commentaire associé. Le fil des commentaires est présenté à la suite."
        )
    )

    story.append(h3("Actions transverses"))
    story.append(
        table(
            ["Action", "Fenêtre", "Effet"],
            [
                [
                    "Add a comment",
                    "Zone de saisie libre.",
                    "Un commentaire vide n'est pas enregistré. Le commentaire est daté, attribué "
                    "au compte connecté et inscrit au journal.",
                ],
                [
                    "Assign an alert",
                    "Groupe, analyste destinataire, commentaire facultatif.",
                    "L'alerte change d'analyste. Une alerte encore en attente de prise en charge "
                    "passe en analyse ; une alerte déjà escaladée conserve son statut. "
                    "L'affectation est inscrite au journal.",
                ],
            ],
            [18, 30, 52],
            strong_columns=(0,),
        )
    )

    # --- Recherche ----------------------------------------------------------
    story.append(h2("Recherche d'une personne"))
    story.append(
        p(
            "Le type de personne commande les critères comme les colonnes de résultat : chercher "
            "une société par sa date de naissance n'a pas de sens, et afficher une colonne vide "
            "pour la moitié des résultats non plus. Changer de type vide les critères et les "
            "résultats."
        )
    )
    story.append(
        table(
            ["Type", "Critères de recherche", "Colonnes de résultat"],
            [
                [
                    "Natural Person",
                    "Identifiant personne, nom, prénom, date de naissance.",
                    "Identifiant personne, identifiant système, nom, nom alternatif, prénom "
                    "usuel, liste des prénoms, sexe, date de naissance, code du lieu de "
                    "naissance, pays de naissance, entité, sous-entité (12 colonnes).",
                ],
                [
                    "Legal Entity",
                    "Identifiant personne, raison sociale, identifiant société.",
                    "Identifiant personne, identifiant système, raison sociale, forme juridique, "
                    "référence, pays d'immatriculation, domaine d'activité, date de création, "
                    "identifiant société (9 colonnes).",
                ],
            ],
            [16, 30, 54],
            strong_columns=(0,),
        )
    )
    story.append(
        p(
            "Les critères textuels acceptent une correspondance partielle insensible à la casse ; "
            "la date de naissance exige une correspondance exacte. Le critère « prénom » "
            "interroge indifféremment le prénom usuel, la liste des prénoms et le nom alternatif, "
            "car l'utilisateur ne sait pas à l'avance sous quel champ le référentiel a rangé "
            "l'information dont il dispose. La saisie de la date pose ses séparateurs "
            "automatiquement."
        )
    )
    story.append(
        p(
            "La recherche ne part qu'avec au moins un critère renseigné pour le type courant : "
            "une recherche sans critère ramènerait le référentiel entier, ce qui n'a aucune "
            "utilité d'analyse. Deux états vides sont distingués — avant toute recherche, "
            "l'écran invite à saisir des critères ; après une recherche sans résultat, il indique "
            "qu'aucune personne ne correspond. Confondre les deux laisserait croire à un "
            "référentiel vide."
        )
    )

    # --- Profil -------------------------------------------------------------
    story.append(h2("Profil de risque d'une personne"))
    story.append(
        p(
            "L'écran répond à une question : que sait-on du risque porté par cette personne, et "
            "sur quelles alertes ce jugement repose-t-il ? Il se lit de haut en bas, de la "
            "synthèse au détail."
        )
    )
    story.append(
        table(
            ["Bloc", "Contenu"],
            [
                [
                    "Synthèse des risques",
                    "Risque global de la personne, puis une pastille par dispositif de screening "
                    "avec son niveau et la date du dernier contrôle.",
                ],
                [
                    "Bandeau d'identité",
                    "État civil complet pour une personne physique, signalétique société pour une "
                    "personne morale, accompagnés des identifiants et du rattachement.",
                ],
                [
                    "Sections complémentaires",
                    "Contact, coordonnées bancaires, coordonnées postales, contrat, liens vers "
                    "d'autres personnes. Chaque section se déplie à la demande ; la section des "
                    "liens n'est présente que si la personne en porte.",
                ],
                [
                    "Alertes",
                    "Tableau de la totalité des alertes de la personne, ouvertes comme traitées, "
                    "avec recherche plein texte, filtre par statut, filtre par typologie, tri, "
                    "compteur et pagination.",
                ],
                [
                    "Aperçu d'une alerte",
                    "Panneau latéral ouvert depuis une ligne : identification de l'alerte, "
                    "rapprochement, affectation. Une commande conduit à l'écran de traitement.",
                ],
            ],
            [24, 76],
            strong_columns=(0,),
        )
    )
    story.append(
        p(
            "<b>Calcul du risque global.</b> Le risque global est celui de la composante la plus "
            "sévère. Il n'est jamais moyenné : une inscription au gel ne se compense pas par "
            "l'absence de risque sur les trois autres dispositifs."
        )
    )
    story.append(
        p(
            "Le tableau des alertes porte onze colonnes : statut, identifiant d'alerte, date de "
            "l'alerte, typologie, circuit, détail, décision, date de traitement, groupe, "
            "utilisateur et la commande d'ouverture. Les colonnes de décision et de date de "
            "traitement restent vides pour une alerte ouverte."
        )
    )
    story.append(
        p(
            "Le statut est coloré selon sa portée : orange tant que l'alerte est ouverte, rouge "
            "lorsqu'elle appelle une mesure, vert une fois écartée, et noir plein pour une "
            "inscription au gel — jamais rouge, afin que le gel se distingue au premier coup "
            "d'œil d'une simple escalade."
        )
    )


def section_rules(story: list) -> None:
    story.append(h1("Règles de gestion"))
    story.append(
        p(
            "Les règles ci-dessous sont opposables : elles fixent le comportement attendu de "
            "l'application et servent de base aux cas de recette."
        )
    )

    story.append(h2("Cycle de vie de l'alerte"))
    for title, text in [
        (
            "Statut unique",
            "Une alerte porte à tout instant un et un seul statut parmi les huit du chapitre 3.2.",
        ),
        (
            "Partition des corbeilles",
            "Une alerte apparaît dans la corbeille des alertes ouvertes si et seulement si son "
            "statut n'est pas terminal, et dans la corbeille des alertes traitées dans le cas "
            "contraire. Aucune alerte ne figure dans les deux, aucune ne manque aux deux.",
        ),
        (
            "Statut initial",
            "Une alerte générée par le moteur de screening entre dans le système au statut "
            "TO_CLEAR_L1, sans analyste affecté.",
        ),
        (
            "Prise en charge",
            "L'affectation d'une alerte en attente de prise en charge la fait passer en analyse "
            "de niveau 1. L'affectation d'une alerte déjà escaladée ne modifie pas son statut : "
            "seul l'analyste change.",
        ),
        (
            "Irréversibilité",
            "Une alerte parvenue à un statut terminal n'est plus modifiable : le panneau de "
            "décision n'est plus proposé et l'écran de traitement la présente en lecture seule.",
        ),
    ]:
        story.append(rule_block(title, text))

    story.append(h2("Décision"))
    for title, text in [
        (
            "Décisions offertes",
            "Le panneau de décision ne présente que les décisions dont le niveau requis est celui "
            "du compte connecté : « Cleared alert - No Risk - Level 1 » et « Escalate to Level 2 » "
            "au niveau 1 ; « Cleared alert - No Risk - Level 2 » et « Blacklisted - Under "
            "Sanctions » au niveau 2.",
        ),
        (
            "Vigilance renforcée hors panneau",
            "La décision « Enforced scrutiny » n'est proposée dans aucun panneau : elle qualifie "
            "un profil client à l'issue d'une revue périodique, non l'issue d'une alerte.",
        ),
        (
            "Justification obligatoire",
            "La validation d'une décision exige qu'une décision soit sélectionnée et que la "
            "justification comporte au moins un caractère non blanc. Tant que ces deux conditions "
            "ne sont pas réunies, la commande de validation reste inactive.",
        ),
        (
            "Longueur de la justification",
            "La justification est plafonnée à 1 000 caractères. Le compteur de saisie est visible "
            "pendant la frappe et la limite est appliquée par le champ lui-même.",
        ),
        (
            "Effet de la décision",
            "L'enregistrement d'une décision fixe le statut résultant, mémorise la justification, "
            "horodate le traitement et attribue l'alerte au compte qui a décidé.",
        ),
        (
            "Restitution de la conséquence",
            "L'application confirme la décision en rappelant sa conséquence métier, telle "
            "qu'énoncée au chapitre 3.3.",
        ),
    ]:
        story.append(rule_block(title, text))

    story.append(h2("Corbeilles et recherche"))
    for title, text in [
        (
            "Cumul des critères",
            "Les critères d'un panneau de filtres se cumulent : une alerte n'est retenue que si "
            "elle satisfait simultanément tous les critères renseignés. Un critère laissé vide "
            "n'exclut rien.",
        ),
        (
            "Application différée",
            "Les critères saisis ne s'appliquent qu'à la validation du panneau. Ils sont alors "
            "figés et le tableau revient à sa première page.",
        ),
        (
            "Stabilité du tri",
            "À valeur égale sur la colonne de tri, les lignes sont ordonnées par identifiant "
            "d'alerte croissant, de sorte que deux affichages successifs du même jeu de données "
            "donnent le même ordre.",
        ),
        (
            "Réinitialisation au changement de corbeille",
            "Le passage d'un onglet de corbeille à un autre vide les filtres et la sélection et "
            "ramène à la première page.",
        ),
        (
            "Verrouillage des alertes traitées",
            "La corbeille des alertes traitées n'offre ni sélection de lignes ni action groupée.",
        ),
        (
            "Recherche non vide",
            "La recherche d'une personne n'est déclenchée qu'avec au moins un critère renseigné "
            "parmi ceux du type de personne courant.",
        ),
        (
            "Distinction des états vides",
            "L'absence de résultat après recherche et l'attente de critères avant recherche sont "
            "présentées différemment.",
        ),
    ]:
        story.append(rule_block(title, text))

    story.append(h2("Référentiel et affichage"))
    for title, text in [
        (
            "Un identifiant système par filiale",
            "Chaque filiale porte exactement un identifiant système, et c'est la filiale qui le "
            "porte. Une personne, une alerte et un profil héritent de l'identifiant système de "
            "leur filiale et n'en définissent jamais un autre.",
        ),
        (
            "Libellés centralisés",
            "Les libellés, codes et couleurs des statuts, typologies, décisions et niveaux de "
            "risque proviennent d'une source unique. Aucun écran n'en redéfinit localement.",
        ),
        (
            "Donnée absente",
            "Un champ non renseigné par le référentiel est affiché « - », jamais laissé vide.",
        ),
        (
            "Format des taux",
            "Un taux de similarité est affiché en pourcentage avec au plus quatre décimales, les "
            "décimales non significatives étant supprimées.",
        ),
        (
            "Format des dates",
            "Les dates sont affichées au format JJ/MM/AAAA et les horodatages au format JJ/MM/AAAA "
            "HH:MM. Le tri des dates s'effectue sur une clé chronologique, non sur la chaîne "
            "affichée.",
        ),
        (
            "Risque global non moyenné",
            "Le risque global d'une personne est celui de sa composante la plus sévère.",
        ),
    ]:
        story.append(rule_block(title, text))


def section_traceability(story: list) -> None:
    story.append(h1("Traçabilité et audit"))

    story.append(h2("Principe"))
    story.append(
        p(
            "La valeur probante de l'application repose sur son journal. Toute modification d'une "
            "alerte passe par un point de passage unique, et chacune y écrit son propre "
            "événement : il n'existe aucun chemin permettant de modifier une alerte sans laisser "
            "de trace. Le journal est traité comme un registre en écriture seule — aucun "
            "écran n'expose de modification ni de suppression d'entrée."
        )
    )

    story.append(h2("Événements tracés"))
    story.append(
        table(
            ["Événement", "Fait générateur", "Éléments consignés"],
            [
                [
                    "Alert generated",
                    "Génération du rapprochement par le moteur de screening.",
                    "Horodatage de génération, statut initial. Aucun auteur : l'événement est "
                    "automatique.",
                ],
                [
                    "Alert assigned",
                    "Affectation d'une alerte, unitaire ou par lot.",
                    "Analyste précédent, nouvel analyste, auteur de l'affectation et son groupe, "
                    "commentaire éventuel.",
                ],
                [
                    "Status changed",
                    "Changement de statut hors décision.",
                    "Statut précédent, statut nouveau, auteur et son groupe.",
                ],
                [
                    "Comment added",
                    "Ajout d'un commentaire sur l'alerte.",
                    "Texte du commentaire, auteur et son groupe, horodatage.",
                ],
                [
                    "Decision taken",
                    "Enregistrement d'une décision.",
                    "Statut précédent, libellé de la décision, justification, auteur et son "
                    "groupe, horodatage.",
                ],
            ],
            [17, 30, 53],
            strong_columns=(0,),
        )
    )

    story.append(h2("Reconstitution de l'historique"))
    story.append(
        p(
            "Une alerte existante à la mise en service ne dispose pas d'un journal complet. "
            "L'application en reconstitue les étapes à partir de son état : sa génération, son "
            "affectation le cas échéant, son changement de statut si elle a quitté l'attente de "
            "prise en charge, et sa décision si elle en porte une. Cette reconstitution est "
            "explicite et se distingue des événements réellement produits par l'usage."
        )
    )

    story.append(h2("Exigences de conservation"))
    story.extend(
        bullets(
            [
                "l'ordre chronologique des événements d'une alerte doit être restituable à tout "
                "moment ;",
                "l'auteur d'un événement est identifié par son identifiant de connexion et son "
                "groupe au moment de l'action, non par son groupe courant ;",
                "la justification d'une décision est conservée intégralement, sans troncature à "
                "l'affichage dans le journal ;",
                "aucune purge ni aucune anonymisation n'est offerte depuis l'application : ces "
                "opérations relèvent de la politique de conservation du groupe et de ses outils "
                "d'administration.",
            ]
        )
    )


def section_dataset(story: list) -> None:
    story.append(h1("Jeu de données de démonstration"))
    story.append(
        p(
            "L'application est livrée avec un jeu de données fictif permettant d'éprouver chaque "
            "écran dans des volumes réalistes, sans dépendance à un système amont. Les données "
            "sont générées de façon déterministe : deux exécutions produisent le même jeu, ce qui "
            "rend les cas de recette reproductibles."
        )
    )

    story.append(h2("Volumes"))
    story.append(
        table(
            ["Ensemble", "Volume", "Observation"],
            [
                ["Alertes ouvertes", "706", "Alimentent My alerts et Alert Basket."],
                ["Alertes traitées", "92", "Alimentent Processed alerts."],
                ["Total", "798", "Réparties sur les quatre typologies."],
                ["Filiales", "5", "Une sous-entité et un identifiant système chacune."],
                ["Comptes", "6", "Quatre au niveau 2, deux au niveau 1."],
            ],
            [26, 14, 60],
            strong_columns=(0,),
        )
    )

    story.append(h2("Référentiel des filiales"))
    story.append(
        table(
            ["Filiale", "Pays", "Sous-entité", "Identifiant système"],
            [
                ["Nordia Life", "Irlande", "Nordia Life DAC", "SYS_NORDIA"],
                ["Astrea Assurances", "France", "Astrea France", "SYS_ASTREA"],
                ["Verema Seguros", "Espagne", "Verema España", "SYS_VEREMA"],
                ["Lumina Vita", "Italie", "Lumina Italia", "SYS_LUMINA"],
                ["Helvia Insurance", "Luxembourg", "Helvia Luxembourg", "SYS_HELVIA"],
            ],
            [26, 18, 28, 28],
            code_columns=(3,),
        )
    )
    story.append(
        caption(
            "Cinq filiales, pas davantage, et un identifiant système par filiale : ces deux "
            "règles tiennent le jeu de données et sont vérifiées par les tests automatisés."
        )
    )

    story.append(h2("Profils de démonstration"))
    story.append(
        p(
            "Deux personnes servent de support aux démonstrations de profil de risque : une "
            f"personne physique ({code('PP123456789')}) et une personne morale "
            f"({code('PM123456789')}), chacune porteuse de plusieurs alertes couvrant les quatre "
            "typologies et plusieurs issues. Une alerte de référence "
            f"({code('6134')}) sert de support à la démonstration de l'écran de traitement : elle "
            "porte un rapprochement complet avec plusieurs fiches candidates."
        )
    )

    story.append(h2("Statut des données"))
    story.append(
        note(
            "Les entités, sous-entités, identifiants système, comptes, personnes et alertes de ce "
            "jeu sont <b>fictifs</b>. Ils ne désignent aucune organisation réelle, aucune "
            "personne réelle et aucune mesure de gel effective. Ils ne doivent en aucun cas être "
            "confondus avec des données de production ni servir de fondement à une décision."
        )
    )


def section_nfr(story: list) -> None:
    story.append(h1("Exigences transverses"))

    story.append(h2("Accessibilité"))
    story.extend(
        bullets(
            [
                "toute action est atteignable au clavier, y compris le tri des colonnes, les "
                "onglets et les fenêtres modales ;",
                "un lien d'évitement, premier élément tabulable de la page, conduit directement "
                "au contenu principal ;",
                "les fenêtres modales et les panneaux latéraux retiennent le focus tant qu'ils "
                "sont ouverts et le restituent à leur fermeture ;",
                "l'état de tri d'une colonne, l'état d'ouverture d'une section et l'onglet actif "
                "sont annoncés aux technologies d'assistance ;",
                "l'information n'est jamais portée par la seule couleur : chaque pastille de "
                "statut est accompagnée de son libellé.",
            ]
        )
    )

    story.append(h2("Ergonomie"))
    story.extend(
        bullets(
            [
                "un thème unique, clair, sans bascule : la lisibilité des pastilles de statut est "
                "réglée une fois pour toutes ;",
                "les tableaux larges défilent horizontalement à l'intérieur de leur cadre, sans "
                "jamais élargir la page ;",
                "les écrans restent utilisables sur écran réduit : les onglets de navigation "
                "défilent alors horizontalement et les grilles se réorganisent en colonne ;",
                "chaque action produit un retour visible : confirmation d'enregistrement, "
                "signalement d'une sélection vide, rappel de la conséquence d'une décision.",
            ]
        )
    )

    story.append(h2("Sécurité"))
    story.extend(
        bullets(
            [
                "les permissions décrites au chapitre 2.2 pilotent l'affichage et ne constituent "
                "pas une couche de sécurité : toute action doit être revalidée côté serveur ;",
                "l'identité du compte connecté proviendra, en déploiement réel, du fournisseur "
                "d'identité du groupe ; le sélecteur de compte est un dispositif de "
                "démonstration ;",
                "chaque appel sortant porte un identifiant de corrélation et le groupe "
                "d'habilitation du compte, afin de rendre les traces applicatives rapprochables "
                "des traces serveur ;",
                "aucune donnée de personne n'est conservée hors de la session de l'utilisateur.",
            ]
        )
    )

    story.append(h2("Internationalisation"))
    story.append(
        p(
            "Les libellés fonctionnels des écrans d'alerte sont en anglais, langue de travail du "
            "dispositif de screening et des listes du fournisseur de données ; les écrans de "
            "profil de risque et les messages de confirmation sont en français. Le bandeau expose "
            "un sélecteur de langue, réservé à une évolution ultérieure. Les libellés étant "
            "centralisés dans le référentiel métier, leur traduction ne requiert aucune "
            "modification des écrans."
        )
    )

    story.append(h2("Performance"))
    story.extend(
        bullets(
            [
                "les corbeilles restent fluides sur plusieurs centaines d'alertes : filtrage, tri "
                "et pagination sont recalculés à la demande et uniquement lorsque leurs données "
                "d'entrée changent ;",
                "chaque écran est chargé à la demande, de sorte que l'ouverture de l'application "
                "ne télécharge que le nécessaire ;",
                "les polices de caractères sont servies par l'application elle-même, sans "
                "dépendance à un service tiers.",
            ]
        )
    )


def section_annexes(story: list) -> None:
    story.append(h1("Annexes"))

    story.append(h2("Récapitulatif des écrans"))
    story.append(
        table(
            ["Écran", "Chemin", "Titre du document", "Accès"],
            [
                ["My alerts", "/my-alerts", "My alerts — AML PROJECT", "Onglet 1"],
                ["Alert Basket", "/alert-basket", "Alert Basket — AML PROJECT", "Onglet 2"],
                [
                    "Processed alerts",
                    "/processed-alerts",
                    "Processed alerts — AML PROJECT",
                    "Onglet 3",
                ],
                ["Search person", "/search-person", "Search person — AML PROJECT", "Onglet 4"],
                [
                    "Traitement d'une alerte",
                    "/alerts/:alertId",
                    "Alert processing — AML PROJECT",
                    "Depuis un tableau",
                ],
                [
                    "Profil de risque",
                    "/person/:personId",
                    "Profil de risque — AML PROJECT",
                    "Depuis un tableau",
                ],
            ],
            [24, 22, 36, 18],
            code_columns=(1,),
        )
    )

    story.append(h2("Correspondance décision / statut"))
    story.append(
        table(
            ["Décision", "Niveau", "Statut résultant", "Corbeille d'arrivée"],
            [
                [
                    "Cleared alert - No Risk - Level 1",
                    "Level 1",
                    "CLEARED_L1",
                    "Processed alerts",
                ],
                ["Escalate to Level 2", "Level 1", "ESCALATED_L2", "Alert Basket"],
                [
                    "Cleared alert - No Risk - Level 2",
                    "Level 2",
                    "CLEARED_L2",
                    "Processed alerts",
                ],
                ["Blacklisted - Under Sanctions", "Level 2", "BLACKLISTED", "Processed alerts"],
                ["Enforced scrutiny", "Level 2", "ENFORCED_SCRUTINY", "Processed alerts"],
            ],
            [34, 14, 24, 28],
            code_columns=(2,),
        )
    )

    story.append(h2("Colonnes du tableau de rapprochement"))
    story.append(
        table(
            ["Rang", "Colonne", "Contenu"],
            [
                ["1", "Source", "PERSON pour la ligne de référence, FACTIVA pour une fiche."],
                ["2", "Rate", "Taux de similarité de la fiche. Vide sur la ligne de référence."],
                ["3", "Surname", "Nom de famille."],
                ["4", "Alternate name", "Nom alternatif ou nom d'usage."],
                ["5", "Usual given name", "Prénom usuel."],
                ["6", "List of given names", "Liste complète des prénoms."],
                ["7", "Gender", "Sexe."],
                ["8", "Date of birth", "Date de naissance complète."],
                ["9", "Year of birth", "Année de naissance, lorsque la date complète est absente."],
                ["10", "Place code of birth", "Code du lieu de naissance."],
                ["11", "Country of birth", "Pays de naissance."],
                ["12", "Country code of the address", "Code pays de l'adresse connue."],
                ["13", "Citizenship country", "Pays de nationalité."],
            ],
            [8, 26, 66],
            strong_columns=(1,),
        )
    )

    story.append(h2("Suivi des versions"))
    story.append(
        table(
            ["Version", "Date", "Nature de la modification"],
            [
                [
                    VERSION,
                    DATE,
                    "Version initiale. Décrit l'application telle qu'implémentée : quatre "
                    "typologies, huit statuts, cinq décisions, six écrans, référentiel de cinq "
                    "filiales.",
                ],
            ],
            [14, 18, 68],
        )
    )


# =============================================================================
# Assemblage
# =============================================================================


def main() -> None:
    story: list = []

    cover(story)
    toc(story)

    section_introduction(story)
    story.append(PageBreak())
    section_actors(story)
    story.append(PageBreak())
    section_reference(story)
    story.append(PageBreak())
    section_data_model(story)
    story.append(PageBreak())
    section_navigation(story)
    story.append(PageBreak())
    section_screens(story)
    story.append(PageBreak())
    section_rules(story)
    story.append(PageBreak())
    section_traceability(story)
    story.append(PageBreak())
    section_dataset(story)
    story.append(PageBreak())
    section_nfr(story)
    story.append(PageBreak())
    section_annexes(story)

    doc = build_document()
    # Deux passes : la première alimente le sommaire, la seconde le pagine juste.
    doc.multiBuild(story)
    print(f"Écrit : {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
