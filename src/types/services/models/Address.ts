/**
 * Describes an address.
 */
export class Address {

    /**
     * Gets or sets the street address.
     **/
    public StreetAddress!: string;

    /**
     * Gets or sets the City for this address.
     **/
    public City!: string;

    /**
     * Gets or sets the State for this address.
      **/
    public State!: string;

    /**
     * Gets or sets the Zip Code for this address.
     **/
    public ZipCode!: number | null;

    /**
     * Determines if the two addresses are equal.
     * 
     * @param a1 First address.
     * @param a2 Second address.
     */
    public static areEqual(a1: Address | null, a2: Address | null): boolean {

        if (null == a1 || null == a2) {
            return a1 == a2;
        }

        if (a1.StreetAddress != a2.StreetAddress ||
            a1.City != a2.City ||
            a1.State != a2.State ||
            a1.ZipCode != a2.ZipCode) {

            return false;
        }

        return true;
    }
}