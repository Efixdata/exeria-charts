export const DATA_BRIDGE_EULA_TITLE =
  "End User License Agreement (EULA) for Exeria Data Bridge Plugins";

export const DATA_BRIDGE_EULA_SECTIONS = [
  {
    title: "Important notice",
    paragraphs: [
      'PLEASE READ THIS AGREEMENT CAREFULLY BEFORE DOWNLOADING, INSTALLING, OR USING THE SOFTWARE. BY DOWNLOADING, INSTALLING, OR USING THE SOFTWARE, YOU AGREE TO BE BOUND BY THE TERMS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT DOWNLOAD, INSTALL, OR USE THE SOFTWARE.',
    ],
  },
  {
    title: "Parties",
    paragraphs: [
      'This End User License Agreement ("Agreement") is a legally binding contract between you (either an individual or a single legal entity, hereinafter "Licensee") and EFIX Data Sp. z o.o., a company incorporated under the laws of Poland, with its registered office in Poznań, operating under the trade name Exeria ("Licensor").',
    ],
  },
  {
    title: "1. Definitions",
    paragraphs: [
      '"Software" means the specific Exeria Data Bridge Plugin, connector, or adapter source code and documentation provided by Licensor to facilitate data ingestion into the Exeria charting engine.',
      '"Approved Data Provider" means the third-party market data vendor or financial data provider for which the Software was specifically designed to connect.',
      '"Affiliate Link / Partner Code" means the unique URL, tracking link, or promotional/identification code provided by Licensor to the Licensee for the purpose of purchasing a subscription from the Approved Data Provider.',
    ],
  },
  {
    title: "2. Conditional license grant",
    paragraphs: [
      "Subject to the terms and conditions of this Agreement, and strictly conditioned upon the fulfillment of the requirements set forth in Section 3, Licensor hereby grants Licensee a non-exclusive, non-transferable, revocable, worldwide license to use, install, and integrate the Software solely for internal business or personal use in connection with the Exeria charting library.",
    ],
  },
  {
    title: "3. Condition precedent and eligibility",
    paragraphs: [
      "The license granted under Section 2 is explicitly conditioned upon the following:",
      "Affiliate registration: Licensee must establish a valid, paid account and subscription with the Approved Data Provider directly through the Licensor's designated Affiliate Link or by utilizing the Licensor's Partner Code during the checkout process.",
      "Price equality: Licensor guarantees that the price paid by the Licensee to the Approved Data Provider via the Affiliate Link/Partner Code is identical to the direct, public pricing offered by said provider.",
    ],
  },
  {
    title: "4. License restrictions and co-termination",
    paragraphs: [
      "Licensee agrees to abide by the following strict operational restrictions. Any violation shall constitute a material breach of this Agreement and result in the automatic revocation of the license:",
      "No endpoint swapping: Licensee shall not modify, alter, adapt, or rewire the Software for the purpose of redirecting its data ingestion capabilities to alternative data endpoints, unauthorized servers, different data providers, or internal simulated data structures. The Software must only be used with the specific Approved Data Provider it was designed for.",
      "Prohibition on redistribution: Licensee may not sub-license, rent, lease, sell, distribute, or share the Software (or its source code) with any third party who has not independently fulfilled the conditional requirements set forth in Section 3.",
      "Co-terminus expiration: This Agreement, and the license granted hereunder, is inextricably tied to the Licensee's subscription with the Approved Data Provider. In the event that Licensee cancels, suspends, fails to pay, or terminates their subscription with the Approved Data Provider, this License shall automatically and immediately expire without requiring further notice from the Licensor.",
    ],
  },
  {
    title: "5. Obligations upon termination",
    paragraphs: [
      "Immediately upon termination or expiration of this Agreement (including expiration due to the cancellation of the underlying data subscription):",
      "Licensee's right to use the Software shall immediately cease.",
      "Licensee must immediately remove, delete, and permanently destroy all copies of the Software from all development, testing, staging, and production environments, as well as any backups.",
    ],
  },
  {
    title: "6. Intellectual property ownership",
    paragraphs: [
      "The Software is licensed, not sold. Licensor retains all right, title, and interest in and to the Software, including all copyrights, patents, trade secrets, trademarks, and other intellectual property rights therein. No title to or ownership of the Software is transferred to Licensee under this Agreement.",
    ],
  },
  {
    title: "7. Disclaimer of warranties",
    paragraphs: [
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
    ],
  },
  {
    title: "8. Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE.",
    ],
  },
  {
    title: "9. Governing law and jurisdiction",
    paragraphs: [
      "This Agreement shall be governed by, and construed in accordance with, the laws of Poland, without regard to its conflict of law principles. Any legal suit, action, or proceeding arising out of or related to this Agreement shall be instituted exclusively in the courts of Poznań, Poland.",
    ],
  },
] as const;
