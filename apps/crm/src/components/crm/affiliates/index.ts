import type { Affiliate } from "../types";
import { AffiliateList } from "./AffiliateList";
import { AffiliateEdit } from "./AffiliateEdit";
import { AffiliateShow } from "./AffiliateShow";

export default {
  list: AffiliateList,
  edit: AffiliateEdit,
  show: AffiliateShow,
  recordRepresentation: (record: Affiliate) => record?.referral_code,
};
