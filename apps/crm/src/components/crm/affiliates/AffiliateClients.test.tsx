import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";
import {
  AffiliateAttributionHistory,
  AffiliateClients,
} from "./AffiliateClients";

const datos = {
  companies: [
    { id: 1, name: "Cliente por enlace", referred_by_affiliate_id: 7 },
    { id: 2, name: "Cliente manual", referred_by_affiliate_id: 7 },
    { id: 3, name: "De otro afiliado", referred_by_affiliate_id: 8 },
  ],
  affiliates: [
    { id: 7, referral_code: "ana", active: true },
    { id: 8, referral_code: "beto", active: true },
  ],
  affiliate_attributions: [
    {
      id: 1,
      company_id: 1,
      affiliate_id: 7,
      source: "enlace",
      status: "vigente",
      origin_application: "kontrolia",
      created_at: "2026-10-01T10:00:00.000Z",
    },
    {
      id: 2,
      company_id: 2,
      affiliate_id: 7,
      source: "manual",
      status: "vigente",
      reason: "Lo presentó en persona",
      created_at: "2026-10-05T10:00:00.000Z",
    },
  ],
};

describe("AffiliateClients", () => {
  it("lista sólo los clientes del afiliado, con cómo llegó cada uno", async () => {
    // Arrange + Act
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <AffiliateClients afiliadoId={7} />
      </StoryWrapper>,
    );

    // Assert
    await expect
      .element(screen.getByText("Cliente por enlace"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Cliente manual"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("De otro afiliado"))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Enlace de referido"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Manual", { exact: true }))
      .toBeInTheDocument();
  });

  it("el historial muestra el motivo de una liga manual", async () => {
    // Arrange + Act
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <AffiliateAttributionHistory afiliadoId={7} />
      </StoryWrapper>,
    );

    // Assert
    await expect
      .element(screen.getByText("Motivo: Lo presentó en persona"))
      .toBeInTheDocument();
  });
});
