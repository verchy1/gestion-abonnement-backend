const express = require("express");
const PDFDocument = require("pdfkit");
const qr = require("qr-image");
const fs = require("fs");
const path = require("path");
const Utilisateur = require("../models/Utilisateurs");
const { decrypt } = require("../utils/encryption");
const auth = require('../middleware/auth');

const router = express.Router();

router.get("/:id", auth, async (req, res) => {
    try {
        const user = await Utilisateur.findById(req.params.id).populate("abonnementId");
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        const abo = user.abonnementId;
        const profil = abo.profils.find(p => p.utilisateurId?.toString() === user._id.toString());

        const doc = new PDFDocument({ size: "A4", margin: 0 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=recu_ovfa_${user._id}.pdf`);
        doc.pipe(res);

        // Palette de couleurs moderne
        const primary = "#2563EB";      // Bleu moderne
        const secondary = "#3B82F6";    // Bleu clair
        const accent = "#10B981";       // Vert accent
        const dark = "#1E293B";         // Gris foncé
        const light = "#F8FAFC";        // Gris très clair
        const border = "#E2E8F0";       // Bordure subtile

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        // ========== HEADER MODERNE ==========
        // Bandeau supérieur avec gradient simulé
        doc.rect(0, 0, pageWidth, 140).fill(primary);
        doc.rect(0, 120, pageWidth, 20).fill(secondary);
        
        // Logo
        const logoPath = path.join(__dirname, "../public/logo.png");
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, pageWidth - margin - 90, 25, { width: 90, height: 90 });
        }

        // Titre principal
        doc.fillColor("white")
           .fontSize(32)
           .font("Helvetica-Bold")
           .text("OVFA SERVICES", margin, 35);
        
        doc.fontSize(13)
           .font("Helvetica")
           .text("Votre partenaire en abonnements numériques", margin, 75);

        // Badge "Reçu officiel"
        doc.roundedRect(margin, 100, 140, 28, 5)
           .fill("white");
        doc.fillColor(primary)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("REÇU OFFICIEL", margin + 20, 108);

        // Numéro de reçu et date
        doc.fillColor("white")
           .fontSize(10)
           .font("Helvetica")
           .text(`N° ${user._id.toString().slice(-8).toUpperCase()}`, pageWidth - margin - 150, 35)
           .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 150, 50);

        doc.moveDown(8);

        // ========== TITRE SECTION ==========
        const currentY = 170;
        doc.fillColor(dark)
           .fontSize(24)
           .font("Helvetica-Bold")
           .text("Détails de votre abonnement", margin, currentY);

        // Ligne décorative
        doc.moveTo(margin, currentY + 35)
           .lineTo(margin + 200, currentY + 35)
           .lineWidth(3)
           .strokeColor(accent)
           .stroke();

        // ========== SECTION INFORMATIONS CLIENT ==========
        let yPos = currentY + 60;
        
        // Titre section avec icône simulée
        doc.fillColor(dark)
           .fontSize(14)
           .font("Helvetica-Bold")
           .text("Informations Client", margin, yPos);
        
        yPos += 35;
        
        // Carte avec ombre
        const cardHeight = 120;
        doc.roundedRect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, cardHeight + 5, 8)
           .fill("#E2E8F0");
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), cardHeight, 8)
           .fill(light)
           .stroke();

        const contentStartY = yPos + 20;
        const col1X = margin + 25;
        const col2X = pageWidth / 2 + 10;
        
        // Contenu en deux colonnes - Ligne 1
        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Nom complet", col1X, contentStartY);
        doc.fillColor("#64748B")
           .fontSize(12)
           .font("Helvetica")
           .text(user.nom, col1X, contentStartY + 18);

        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Téléphone", col2X, contentStartY);
        doc.fillColor("#64748B")
           .fontSize(12)
           .font("Helvetica")
           .text(user.telephone, col2X, contentStartY + 18);

        // Ligne 2
        const row2Y = contentStartY + 60;
        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Service souscrit", col1X, row2Y);
        doc.fillColor(primary)
           .fontSize(13)
           .font("Helvetica-Bold")
           .text(abo.service, col1X, row2Y + 18);

        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Montant payé", col2X, row2Y);
        doc.fillColor(accent)
           .fontSize(14)
           .font("Helvetica-Bold")
           .text(`${user.montant} FCFA`, col2X, row2Y + 18);

        yPos += cardHeight;

        // ========== SECTION IDENTIFIANTS ==========
        yPos += 30;
        
        doc.fillColor(dark)
           .fontSize(14)
           .font("Helvetica-Bold")
           .text("Identifiants de connexion", margin, yPos);
        
        yPos += 30;
        
        const credCardHeight = 95;
        doc.roundedRect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, credCardHeight + 5, 8)
           .fill("#E2E8F0");
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), credCardHeight, 8)
           .fill("#FEF3C7")
           .stroke();

        const credStartY = yPos + 18;
        
        const email = abo.credentials?.email || "Non défini";
        let password = "Non défini";
        if (abo.credentials?.password) {
            try { password = decrypt(abo.credentials.password); }
            catch { password = "Erreur de décryptage"; }
        }

        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Email du compte", col1X, credStartY);
        doc.fillColor("#854D0E")
           .fontSize(12)
           .font("Helvetica")
           .text(email, col1X, credStartY + 17);

        doc.fillColor(dark)
           .fontSize(11)
           .font("Helvetica-Bold")
           .text("Mot de passe", col1X, credStartY + 43);
        doc.fillColor("#854D0E")
           .fontSize(12)
           .font("Helvetica-Oblique")
           .text(password, col1X, credStartY + 60);

        yPos += credCardHeight;

        // ========== SECTION PROFIL & VALIDITÉ ==========
        yPos += 30;
        
        // Deux cartes côte à côte
        const cardWidth = (pageWidth - (margin * 2) - 20) / 2;
        
        // Carte Profil
        doc.roundedRect(margin, yPos, cardWidth, 110, 8)
           .fill("#DBEAFE")
           .stroke();
        
        doc.fillColor(dark)
           .fontSize(12)
           .font("Helvetica-Bold")
           .text("Profil attribué", margin + 15, yPos + 15);
        
        if (profil) {
            doc.fillColor("#1E40AF")
               .fontSize(11)
               .font("Helvetica")
               .text(`${profil.nom}`, margin + 15, yPos + 38);
            doc.fontSize(10)
               .text(`PIN: ${profil.codePIN}`, margin + 15, yPos + 58);
            doc.fontSize(9)
               .fillColor("#64748B")
               .text(`Assigné le ${profil.dateAssignation?.toLocaleDateString('fr-FR')}`, 
                     margin + 15, yPos + 78);
        } else {
            doc.fillColor("#64748B")
               .fontSize(10)
               .font("Helvetica-Oblique")
               .text("Aucun profil attribué", margin + 15, yPos + 40);
        }

        // Carte Validité
        doc.roundedRect(margin + cardWidth + 20, yPos, cardWidth, 110, 8)
           .fill("#D1FAE5")
           .stroke();
        
        doc.fillColor(dark)
           .fontSize(12)
           .font("Helvetica-Bold")
           .text("Période de validité", margin + cardWidth + 35, yPos + 15);
        
        doc.fillColor("#065F46")
           .fontSize(10)
           .font("Helvetica")
           .text(`Début: ${new Date().toLocaleDateString('fr-FR')}`, 
                 margin + cardWidth + 35, yPos + 40);
        doc.fontSize(11)
           .font("Helvetica-Bold")
           .text(`Fin: ${user.dateFin.toLocaleDateString('fr-FR')}`, 
                 margin + cardWidth + 35, yPos + 60);

        // QR Code positionné joliment
        const qrData = `OVFA-${user._id}-${abo.service}-${user.dateFin.toLocaleDateString()}`;
        const qrImg = qr.imageSync(qrData, { type: "png" });
        doc.image(qrImg, pageWidth - margin - 100, yPos + 5, { width: 100, height: 100 });

        // ========== FOOTER PROFESSIONNEL ==========
        const footerY = pageHeight - 100;
        
        // Ligne séparatrice
        doc.moveTo(margin, footerY)
           .lineTo(pageWidth - margin, footerY)
           .lineWidth(1)
           .strokeColor(border)
           .stroke();

        // Informations de contact
        doc.fillColor("#64748B")
           .fontSize(9)
           .font("Helvetica")
           .text("Merci pour votre confiance en OVFA Services", margin, footerY + 15, { align: "center" });
        
        doc.fontSize(8)
           .text("  contact@ovfa-subs.com  |  +242 06 525 47 76  |  www.ovfa-subs.com", 
                 margin, footerY + 30, { width: pageWidth - (margin * 2), align: "center" });

        // Bandeau final
        doc.rect(0, pageHeight - 30, pageWidth, 30)
           .fill(primary);
        doc.fillColor("white")
           .fontSize(8)
           .font("Helvetica-Bold")
           .text("Document généré automatiquement - Conservez ce reçu précieusement", 
                 0, pageHeight - 18, { width: pageWidth, align: "center" });

        doc.end();

    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "Erreur lors de la génération du reçu" });
        }
    }
});

module.exports = router;